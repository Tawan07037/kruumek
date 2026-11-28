import { requireRole } from "../../_lib/access.js";
import {
  jsonResponse, errorResponse, assertSameOrigin, readJson, cleanText, makeId
} from "../../_lib/http.js";

const VIEW_ROLES = ["viewer", "editor", "publisher", "admin"];
const EDIT_ROLES = ["editor", "publisher", "admin"];
const PUBLISH_ROLES = ["publisher", "admin"];

async function writeAudit(env, actor, action, resourceId, details = {}) {
  await env.DB.prepare(`
    INSERT INTO audit_logs
      (id, actor_subject, actor_email, action, resource, resource_id, details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    makeId(),
    actor.subject,
    actor.email,
    action,
    "announcement",
    resourceId || null,
    JSON.stringify(details)
  ).run();
}

function handleError(error) {
  if (error?.status) {
    return errorResponse(
      error.message || "เกิดข้อผิดพลาด",
      error.status,
      error.code || "REQUEST_ERROR"
    );
  }
  // Do not disclose SQL/internal exception details to public clients.
  return errorResponse("เกิดข้อผิดพลาดภายในระบบ", 500, "INTERNAL_ERROR");
}

async function handleGet({ request, env }) {
  try {
    const actor = await requireRole(request, env, VIEW_ROLES);
    const result = await env.DB.prepare(`
      SELECT id, title, content, status, created_by_email,
             updated_by_email, created_at, updated_at, published_at
      FROM announcements
      ORDER BY updated_at DESC
      LIMIT 100
    `).all();

    return jsonResponse({ success: true, role: actor.role, data: result.results || [] });
  } catch (error) {
    return handleError(error);
  }
}

async function handlePost({ request, env }) {
  try {
    assertSameOrigin(request);
    const actor = await requireRole(request, env, EDIT_ROLES);
    const body = await readJson(request);

    const title = cleanText(body.title, 180);
    const content = cleanText(body.content, 10000);
    if (!title || !content) {
      return errorResponse("กรุณากรอกหัวข้อและเนื้อหาให้ถูกต้อง", 422, "VALIDATION_ERROR");
    }

    const requestedStatus = body.status || "draft";
    if (!["draft", "published"].includes(requestedStatus)) {
      return errorResponse("สถานะที่ระบุไม่ถูกต้อง", 422, "INVALID_STATUS");
    }
    if (requestedStatus === "published" && !PUBLISH_ROLES.includes(actor.role)) {
      return errorResponse("สิทธิ์ของคุณไม่สามารถเผยแพร่ประกาศได้", 403, "FORBIDDEN");
    }

    const id = makeId();
    await env.DB.prepare(`
      INSERT INTO announcements
        (id, title, content, status, created_by, created_by_email,
         updated_by, updated_by_email, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, title, content, requestedStatus,
      actor.subject, actor.email,
      actor.subject, actor.email,
      requestedStatus === "published" ? new Date().toISOString() : null
    ).run();

    await writeAudit(env, actor, "announcement.create", id, { status: requestedStatus });
    return jsonResponse({ success: true, id, status: requestedStatus }, 201);
  } catch (error) {
    return handleError(error);
  }
}

async function handlePatch({ request, env }) {
  try {
    assertSameOrigin(request);
    const actor = await requireRole(request, env, EDIT_ROLES);
    const body = await readJson(request);

    const id = cleanText(body.id, 80);
    if (!id) return errorResponse("ไม่พบรหัสประกาศ", 422, "VALIDATION_ERROR");

    const current = await env.DB.prepare(`
      SELECT id, title, content, status, created_by
      FROM announcements WHERE id = ?
    `).bind(id).first();

    if (!current) return errorResponse("ไม่พบประกาศที่ต้องการแก้ไข", 404, "NOT_FOUND");

    if (actor.role === "editor" &&
        (current.status !== "draft" || current.created_by !== actor.subject)) {
      return errorResponse("Editor แก้ไขได้เฉพาะ Draft ที่ตนเองสร้าง", 403, "FORBIDDEN");
    }

    const title = body.title === undefined ? current.title : cleanText(body.title, 180);
    const content = body.content === undefined ? current.content : cleanText(body.content, 10000);
    const status = body.status === undefined ? current.status : body.status;

    if (!title || !content) {
      return errorResponse("หัวข้อหรือเนื้อหาไม่ถูกต้อง", 422, "VALIDATION_ERROR");
    }
    if (!["draft", "published", "archived"].includes(status)) {
      return errorResponse("สถานะที่ระบุไม่ถูกต้อง", 422, "INVALID_STATUS");
    }
    if (status !== "draft" && !PUBLISH_ROLES.includes(actor.role)) {
      return errorResponse("สิทธิ์ของคุณไม่สามารถเผยแพร่หรือเก็บประกาศได้", 403, "FORBIDDEN");
    }

    await env.DB.prepare(`
      UPDATE announcements
      SET title = ?, content = ?, status = ?,
          updated_by = ?, updated_by_email = ?,
          updated_at = CURRENT_TIMESTAMP,
          published_at = CASE
            WHEN ? = 'published' THEN COALESCE(published_at, CURRENT_TIMESTAMP)
            ELSE NULL
          END
      WHERE id = ?
    `).bind(
      title, content, status,
      actor.subject, actor.email,
      status, id
    ).run();

    await writeAudit(env, actor, "announcement.update", id, { status });
    return jsonResponse({ success: true, id, status });
  } catch (error) {
    return handleError(error);
  }
}

async function handleDelete({ request, env }) {
  try {
    assertSameOrigin(request);
    const actor = await requireRole(request, env, PUBLISH_ROLES);
    const url = new URL(request.url);
    const id = cleanText(url.searchParams.get("id"), 80);
    if (!id) return errorResponse("กรุณาระบุรหัสประกาศ", 422, "VALIDATION_ERROR");

    const current = await env.DB.prepare(
      "SELECT id FROM announcements WHERE id = ?"
    ).bind(id).first();

    if (!current) return errorResponse("ไม่พบประกาศ", 404, "NOT_FOUND");

    // Soft-delete: retain the row for audit and recovery.
    await env.DB.prepare(`
      UPDATE announcements
      SET status = 'archived',
          updated_by = ?,
          updated_by_email = ?,
          updated_at = CURRENT_TIMESTAMP,
          published_at = NULL
      WHERE id = ?
    `).bind(actor.subject, actor.email, id).run();

    await writeAudit(env, actor, "announcement.archive", id);
    return jsonResponse({ success: true, id, status: "archived" });
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequest(context) {
  switch (context.request.method.toUpperCase()) {
    case "GET": return handleGet(context);
    case "POST": return handlePost(context);
    case "PATCH": return handlePatch(context);
    case "DELETE": return handleDelete(context);
    default:
      return errorResponse("ไม่รองรับ HTTP Method นี้", 405, "METHOD_NOT_ALLOWED");
  }
}
