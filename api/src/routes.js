// Every HTTP route: Functions route template → handler per method.
// src/functions/index.js registers these with the Functions host.
import { getMe, patchMe } from './handlers/me.js';

export const ROUTES = [
  { name: 'me', route: 'me', map: { GET: getMe, PATCH: patchMe } },
];
