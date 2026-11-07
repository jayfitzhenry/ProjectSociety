// In-memory stand-in for src/lib/repo.js: same five methods, same partition and ETag behaviour.
import { HttpError, conflict } from '../src/lib/http.js';
import { PK, setRepo } from '../src/lib/repo.js';

export function fakeRepo() {
  const data = { users: new Map(), characters: new Map(), notes: new Map(), campaigns: new Map() };
  let tick = 0;
  const key = (pk, id) => `${pk}\u0000${id}`;
  const copy = (d) => (d ? structuredClone(d) : null);
  const stamp = (d) => ({ ...structuredClone(d), _etag: `"${++tick}"` });
  const r = {
    data,
    async read(c, pk, id) {
      return copy(data[c].get(key(pk, id)));
    },
    async create(c, doc) {
      const k = key(PK[c](doc), doc.id);
      if (data[c].has(k)) throw new HttpError(409, 'That already exists.', 'exists');
      const saved = stamp(doc);
      data[c].set(k, saved);
      return copy(saved);
    },
    async replace(c, doc, etag) {
      const k = key(PK[c](doc), doc.id);
      const existing = data[c].get(k);
      if (!existing) throw new HttpError(404, 'Not found.', 'not_found');
      if (etag && existing._etag !== etag) throw conflict();
      const saved = stamp(doc);
      data[c].set(k, saved);
      return copy(saved);
    },
    async remove(c, pk, id) {
      data[c].delete(key(pk, id));
    },
    async list(c, pk, o = {}) {
      let out = [...data[c].values()].filter((d) => PK[c](d) === pk);
      if (o.types?.length) out = out.filter((d) => o.types.includes(d.type));
      if (o.campaignId !== undefined) out = out.filter((d) => (d.campaignId ?? null) === o.campaignId);
      if (o.orderBy) out.sort((a, b) => String(b[o.orderBy]).localeCompare(String(a[o.orderBy])));
      if (o.limit) out = out.slice(0, o.limit);
      return out.map(copy);
    },
  };
  return r;
}

/** Fresh fake for each test. */
export function useFake() {
  const r = fakeRepo();
  setRepo(r);
  return r;
}
