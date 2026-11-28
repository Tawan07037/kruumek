/**
 * Same-origin API client for future admin/public data screens.
 * It deliberately does not store access tokens in localStorage.
 */

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("เซิร์ฟเวอร์ส่งคำตอบที่อ่านไม่ได้");
  }

  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message || `คำขอไม่สำเร็จ (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.code = payload?.error?.code || "API_ERROR";
    throw error;
  }

  return payload;
}

export function getPublicAnnouncements() {
  return requestJson("/api/public/announcements");
}

export function getAdminIdentity() {
  return requestJson("/api/admin/whoami");
}

export function getAdminAnnouncements() {
  return requestJson("/api/admin/announcements");
}

export function createAnnouncement(data) {
  return requestJson("/api/admin/announcements", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateAnnouncement(data) {
  return requestJson("/api/admin/announcements", {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export function archiveAnnouncement(id) {
  const query = new URLSearchParams({ id });
  return requestJson(`/api/admin/announcements?${query}`, {
    method: "DELETE"
  });
}

export function getAdminAudit(limit = 50) {
  const query = new URLSearchParams({ limit: String(limit) });
  return requestJson(`/api/admin/audit?${query}`);
}
