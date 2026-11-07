// Who is calling. Static Web Apps sets x-ms-client-principal on every request to a managed API
// (and strips any copy the browser tries to send), so this is the only trusted source of identity.

const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function principalFrom(request) {
  const raw = request.headers?.get?.('x-ms-client-principal');
  if (!raw) return null;
  let p;
  try {
    p = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    return null;
  }
  if (!p || !SAFE_ID.test(String(p.userId || ''))) return null;
  if (!(p.userRoles || []).includes('authenticated')) return null;
  return { id: p.userId, provider: String(p.identityProvider || ''), details: String(p.userDetails || '') };
}

/** A first display name that doesn't leak an email address to other players. */
export function defaultDisplayName(user) {
  const name = user.details.includes('@') ? user.details.split('@')[0] : user.details;
  return name.trim().slice(0, 40) || 'Player';
}
