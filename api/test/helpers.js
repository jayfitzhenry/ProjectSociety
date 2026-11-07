// Fake Functions requests: what Static Web Apps would send for a signed-in (or anonymous) user.
export function principal(id, { provider = 'github', details = id } = {}) {
  return Buffer.from(JSON.stringify({
    identityProvider: provider, userId: id, userDetails: details, userRoles: ['anonymous', 'authenticated'],
  })).toString('base64');
}

export function req({ user, method = 'GET', params = {}, query = {}, body, headers = {}, provider, details } = {}) {
  const h = new Headers(headers);
  if (user) h.set('x-ms-client-principal', principal(user, { provider, details }));
  return {
    method,
    params,
    query: new URLSearchParams(query),
    headers: h,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  };
}

/** Call a handler and return { status, body }. */
export async function call(handler, opts) {
  const res = await handler(req(opts), { error() {} });
  return { status: res.status ?? 200, body: res.jsonBody };
}
