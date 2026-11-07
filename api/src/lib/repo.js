// Data access. Every Cosmos call lives here behind five small methods, so tests can swap in
// the in-memory fake in test/fake-repo.js. Every list is a single-partition query by design.
import { HttpError, conflict } from './http.js';

/** Partition key of a doc in each container. Matches infra/main.bicep. */
export const PK = {
  users: (d) => d.id,
  characters: (d) => d.ownerId,
  notes: (d) => d.ownerId,
  campaigns: (d) => d.campaignId,
};

const ORDERABLE = new Set(['sharedAt', 'updatedAt', 'createdAt']);

/**
 * Build the SQL for list(). Options:
 *   types        only docs whose `type` is in this list
 *   sharedAfter  only docs with sharedAt later than this ISO time
 *   audienceFor  only snippets visible to this user id
 *   campaignId   only docs with this campaignId (used inside the notes/characters partitions)
 *   orderBy      newest first by this field
 *   limit        at most this many
 */
export function buildQuery(opts = {}) {
  const where = [];
  const parameters = [];
  if (opts.types?.length) {
    where.push('ARRAY_CONTAINS(@types, c.type)');
    parameters.push({ name: '@types', value: opts.types });
  }
  if (opts.sharedAfter) {
    where.push('c.sharedAt > @since');
    parameters.push({ name: '@since', value: opts.sharedAfter });
  }
  if (opts.audienceFor) {
    where.push("(c.audience = 'all' OR ARRAY_CONTAINS(c.audience, @uid))");
    parameters.push({ name: '@uid', value: opts.audienceFor });
  }
  if (opts.campaignId !== undefined) {
    where.push('c.campaignId = @cid');
    parameters.push({ name: '@cid', value: opts.campaignId });
  }
  const top = opts.limit ? `TOP ${Math.max(1, Math.floor(Number(opts.limit)))} ` : '';
  let query = `SELECT ${top}* FROM c`;
  if (where.length) query += ` WHERE ${where.join(' AND ')}`;
  if (opts.orderBy) {
    if (!ORDERABLE.has(opts.orderBy)) throw new Error(`Cannot order by ${opts.orderBy}`);
    query += ` ORDER BY c.${opts.orderBy} DESC`;
  }
  return { query, parameters };
}

async function cosmosRepo() {
  const { CosmosClient } = await import('@azure/cosmos');
  const client = new CosmosClient({ endpoint: process.env.COSMOS_ENDPOINT, key: process.env.COSMOS_KEY });
  const db = client.database(process.env.COSMOS_DATABASE || 'society');
  const box = (name) => db.container(name);
  return {
    async read(c, pk, id) {
      try {
        const { resource } = await box(c).item(id, pk).read();
        return resource ?? null;
      } catch (e) {
        if (e.code === 404) return null;
        throw e;
      }
    },
    async create(c, doc) {
      try {
        const { resource } = await box(c).items.create(doc);
        return resource;
      } catch (e) {
        if (e.code === 409) throw new HttpError(409, 'That already exists.', 'exists');
        throw e;
      }
    },
    async replace(c, doc, etag) {
      try {
        const options = etag ? { accessCondition: { type: 'IfMatch', condition: etag } } : undefined;
        const { resource } = await box(c).item(doc.id, PK[c](doc)).replace(doc, options);
        return resource;
      } catch (e) {
        if (e.code === 412) throw conflict();
        if (e.code === 404) throw new HttpError(404, 'Not found.', 'not_found');
        throw e;
      }
    },
    async remove(c, pk, id) {
      try {
        await box(c).item(id, pk).delete();
      } catch (e) {
        if (e.code !== 404) throw e;
      }
    },
    async list(c, pk, opts) {
      const { resources } = await box(c).items.query(buildQuery(opts), { partitionKey: pk }).fetchAll();
      return resources;
    },
  };
}

let current = null;

/** The active repo. Cosmos in production; tests call setRepo() with a fake. */
export async function repo() {
  if (!current) current = cosmosRepo();
  return current;
}

export function setRepo(r) {
  current = Promise.resolve(r);
}

/**
 * Read, change and write back a doc, retrying if someone else wrote in between.
 * `mutate(doc)` edits the doc in place; return false to skip the write. Returns the saved doc, or null if missing.
 */
export async function update(c, pk, id, mutate, tries = 5) {
  const r = await repo();
  for (let i = 0; ; i += 1) {
    const doc = await r.read(c, pk, id);
    if (!doc) return null;
    if ((await mutate(doc)) === false) return doc;
    try {
      return await r.replace(c, doc, doc._etag);
    } catch (e) {
      if (e.status !== 412 || i >= tries - 1) throw e;
    }
  }
}
