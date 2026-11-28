import { requireRole } from "../../_lib/access.js";
import { jsonResponse, errorResponse } from "../../_lib/http.js";

export async function onRequestGet({ request, env }) {
  try {
    await requireRole(request, env, ["publisher", "admin"]);
    const url = new URL(request.url);
    const requested = Number(url.searchParams.get("limit") || 50);
    const limit = Number.isInteger(requested) ? Math.min(Math.max(requested, 1), 100) : 50;

    const result = await env.DB.prepare(`
      SELECT id, actor_email, action, resource, resource_id, details, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(limit).all();

    return jsonResponse({ success: true, data: result.results || [] });
  } catch (error) {
    return errorResponse(
      error.message || "ไม่สามารถอ่าน Audit Log ได้",
      error.status || 500,
      error.code || "INTERNAL_ERROR"
    );
  }
}
