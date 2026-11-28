import { verifyAccessIdentity } from "../../_lib/access.js";
import { jsonResponse, errorResponse } from "../../_lib/http.js";

export async function onRequestGet({ request, env }) {
  try {
    const identity = await verifyAccessIdentity(request, env);
    let role = null;

    if (env.DB) {
      const record = await env.DB.prepare(
        "SELECT role FROM admin_roles WHERE subject = ?"
      ).bind(identity.subject).first();
      role = record?.role || null;
    }

    // This endpoint only returns the caller's own verified identity.
    // Do not expose other users or administrative records here.
    return jsonResponse({
      success: true,
      subject: identity.subject,
      email: identity.email,
      role,
      provisioned: Boolean(role)
    });
  } catch (error) {
    return errorResponse(
      error.message || "ไม่สามารถยืนยันตัวตนได้",
      error.status || 401,
      error.code || "UNAUTHORIZED"
    );
  }
}
