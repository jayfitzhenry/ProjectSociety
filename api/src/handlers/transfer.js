// Export everything the caller owns; import an old save or an export. Import only ever adds.
import { route, ok, created, readJson, clean, badRequest, now } from '../lib/http.js';
import { text, payload, newId } from '../lib/validate.js';
import { repo, update } from '../lib/repo.js';
import { newCharacterDoc } from './characters.js';
import { newNoteDoc } from './notes.js';
import { createCampaignFor } from './campaigns.js';
import { normalizeSegment, readSections } from './stories.js';
import { ensureUser } from './me.js';
import { membershipId } from '../lib/access.js';

const LIMITS = { characters: 50, notes: 300, campaigns: 5, stories: 200 };

export const exportAll = route(async ({ user }) => {
  const r = await repo();
  const u = await ensureUser(user);
  const [characters, notes] = await Promise.all([
    r.list('characters', user.id, { orderBy: 'createdAt' }),
    r.list('notes', user.id, { orderBy: 'updatedAt' }),
  ]);
  // Campaigns you run: the crew sheet and your material.
  const campaigns = [];
  for (const c of (u.campaigns || []).filter((x) => x.role === 'dm')) {
    const docs = await r.list('campaigns', c.campaignId, { types: ['campaign', 'crew', 'story'] });
    const campaign = docs.find((d) => d.type === 'campaign');
    if (!campaign) continue;
    const { id, type, campaignId, updatedAt, ...crew } = clean(docs.find((d) => d.type === 'crew') || {});
    delete crew._etag;
    campaigns.push({
      name: campaign.name,
      crew,
      stories: docs.filter((d) => d.type === 'story').map(normalizeSegment)
        .map((s) => ({ title: s.title, sections: s.sections, shared: s.shared, status: s.status })),
    });
  }
  return ok({
    app: 'project-society', version: 2, exportedAt: now(),
    characters: characters.map(clean), notes: notes.map(clean), campaigns,
  });
});

export const importAll = route(async ({ request, user }) => {
  const body = await readJson(request, 4_000_000);
  const list = (k) => (Array.isArray(body[k]) ? body[k] : []);
  const characters = list('characters');
  const notes = list('notes');
  const campaigns = list('campaigns');
  for (const k of ['characters', 'notes', 'campaigns']) {
    if (list(k).length > LIMITS[k]) throw badRequest(`At most ${LIMITS[k]} ${k} per import.`);
  }
  // Validate everything before writing anything.
  const charDocs = characters.map((c) => newCharacterDoc(user.id, c));
  // Imported notes lose campaign/character links: those ids belonged to the old copies.
  const noteDocs = notes.map((n) => newNoteDoc(user.id, { title: n.title, body: n.body }));
  const campaignSpecs = campaigns.map((c) => {
    const stories = Array.isArray(c?.stories) ? c.stories : [];
    if (stories.length > LIMITS.stories) throw badRequest(`At most ${LIMITS.stories} stories per campaign.`);
    return {
      name: text(c?.name || 'Imported campaign', { max: 80, what: 'The campaign name' }).trim() || 'Imported campaign',
      crew: payload(c?.crew || {}, 400_000, 'The crew sheet'),
      attach: !!c?.attachCharacters,
      // Imported material starts unshared: the DM shares it again when ready. Chosen players
      // were people in the old campaign, so those sections come back as DM only.
      stories: stories.map((s) => ({
        title: text(s?.title, { max: 200, what: 'A segment title' }),
        sections: readSections(s && typeof s === 'object' ? s : {})
          .map(({ to, ...x }) => (x.audience === 'some' ? { ...x, audience: 'dm' } : x)),
        shared: false,
        status: s?.status === 'archived' ? 'archived' : 'draft',
      })),
    };
  });

  const r = await repo();
  const made = [];
  for (const spec of campaignSpecs) {
    const campaign = await createCampaignFor(user, spec.name, spec.crew);
    for (const s of spec.stories) {
      const t = now();
      await r.create('campaigns', { id: newId(), type: 'story', campaignId: campaign.id, ...s, createdAt: t, updatedAt: t });
    }
    made.push({ campaign, attach: spec.attach });
  }
  // An old one-device save: the characters were the crew, so they join the imported campaign.
  const attachTo = made.find((m) => m.attach)?.campaign.id || null;
  const saved = [];
  for (const d of charDocs) saved.push(clean(await r.create('characters', { ...d, campaignId: attachTo })));
  if (attachTo) {
    await update('campaigns', attachTo, membershipId(user.id), (m) => { m.characterIds = saved.map((c) => c.id); });
  }
  for (const d of noteDocs) await r.create('notes', d);
  return created({
    characters: saved,
    notes: noteDocs.length,
    campaigns: made.map((m) => ({ id: m.campaign.id, name: m.campaign.name, role: 'dm' })),
  });
});
