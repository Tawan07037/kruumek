/**
 * Verify the Cloudflare Access JWT at the Pages Function boundary.
 * Configure ACCESS_TEAM_DOMAIN and ACCESS_AUD as Pages environment variables.
 */
const jwksCache = new Map();

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJsonSegment(segment) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(segment)));
}

function unauthorized(message = "ต้องเข้าสู่ระบบผ่าน Cloudflare Access ก่อน") {
  const error = new Error(message);
  error.status = 401;
  error.code = "UNAUTHORIZED";
  return error;
}

export async function verifyAccessIdentity(request, env) {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) throw unauthorized();

  const teamDomain = String(env.ACCESS_TEAM_DOMAIN || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");

  const audience = String(env.ACCESS_AUD || "").trim();

  if (!teamDomain || !audience) {
    const error = new Error("ยังไม่ได้ตั้งค่า Cloudflare Access Environment Variables");
    error.status = 503;
    error.code = "ACCESS_NOT_CONFIGURED";
    throw error;
  }

  if (teamDomain.includes("/") || teamDomain.includes(" ")) {
    const error = new Error("ACCESS_TEAM_DOMAIN มีรูปแบบไม่ถูกต้อง");
    error.status = 500;
    error.code = "ACCESS_CONFIG_INVALID";
    throw error;
  }

  const parts = token.split(".");
  if (parts.length !== 3) throw unauthorized("Access Token ไม่ถูกต้อง");

  let header;
  let claims;
  try {
    header = decodeJsonSegment(parts[0]);
    claims = decodeJsonSegment(parts[1]);
  } catch {
    throw unauthorized("ไม่สามารถอ่าน Access Token ได้");
  }

  if (header.alg !== "RS256" || !header.kid) {
    throw unauthorized("ชนิดลายเซ็นของ Access Token ไม่รองรับ");
  }

  const issuer = `https://${teamDomain}`;
  const now = Math.floor(Date.now() / 1000);

  if (claims.iss !== issuer) throw unauthorized("Token Issuer ไม่ถูกต้อง");
  const tokenAudiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!tokenAudiences.includes(audience)) {
    throw unauthorized("Token Audience ไม่ถูกต้อง");
  }
  if (!Number.isFinite(claims.exp) || claims.exp <= now) {
    throw unauthorized("Access Token หมดอายุแล้ว");
  }
  if (claims.nbf && claims.nbf > now + 30) {
    throw unauthorized("Access Token ยังไม่เริ่มใช้งาน");
  }
  if (!claims.sub || !claims.email || typeof claims.email !== "string") {
    throw unauthorized("Token ไม่มีข้อมูลตัวตนที่จำเป็น");
  }

  let cacheEntry = jwksCache.get(teamDomain);
  if (!cacheEntry || cacheEntry.expiresAt < Date.now()) {
    const response = await fetch(`${issuer}/cdn-cgi/access/certs`, {
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      const error = new Error("ไม่สามารถตรวจสอบกุญแจ Cloudflare Access ได้");
      error.status = 503;
      error.code = "ACCESS_JWKS_UNAVAILABLE";
      throw error;
    }
    const jwks = await response.json();
    if (!Array.isArray(jwks.keys)) {
      const error = new Error("รูปแบบ Access JWKS ไม่ถูกต้อง");
      error.status = 503;
      error.code = "ACCESS_JWKS_INVALID";
      throw error;
    }
    cacheEntry = { keys: jwks.keys, expiresAt: Date.now() + 5 * 60 * 1000 };
    jwksCache.set(teamDomain, cacheEntry);
  }

  let jwk = cacheEntry.keys.find((key) => key.kid === header.kid);
  if (!jwk) {
    jwksCache.delete(teamDomain);
    const refresh = await fetch(`${issuer}/cdn-cgi/access/certs`, {
      headers: { "Accept": "application/json" }
    });
    if (refresh.ok) {
      const fresh = await refresh.json();
      if (Array.isArray(fresh.keys)) {
        cacheEntry = { keys: fresh.keys, expiresAt: Date.now() + 5 * 60 * 1000 };
        jwksCache.set(teamDomain, cacheEntry);
        jwk = cacheEntry.keys.find((key) => key.kid === header.kid);
      }
    }
  }
  if (!jwk) throw unauthorized("ไม่พบกุญแจสำหรับตรวจสอบ Access Token");

  let publicKey;
  try {
    publicKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = decodeBase64Url(parts[2]);
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      signature,
      signedData
    );
    if (!valid) throw unauthorized("ลายเซ็น Access Token ไม่ถูกต้อง");
  } catch (error) {
    if (error?.status) throw error;
    throw unauthorized("ตรวจสอบลายเซ็น Access Token ไม่สำเร็จ");
  }

  return {
    subject: String(claims.sub),
    email: claims.email.toLowerCase(),
    issuer: claims.iss
  };
}

export async function requireRole(request, env, allowedRoles) {
  const identity = await verifyAccessIdentity(request, env);

  if (!env.DB) {
    const error = new Error("ยังไม่ได้เชื่อม D1 Database Binding ชื่อ DB");
    error.status = 503;
    error.code = "DATABASE_NOT_CONFIGURED";
    throw error;
  }

  const record = await env.DB.prepare(
    "SELECT role, email FROM admin_roles WHERE subject = ?"
  ).bind(identity.subject).first();

  if (!record || !allowedRoles.includes(record.role)) {
    const error = new Error("บัญชีนี้ไม่มีสิทธิ์ทำรายการดังกล่าว");
    error.status = 403;
    error.code = "FORBIDDEN";
    throw error;
  }

  return { ...identity, role: record.role, storedEmail: record.email };
}
