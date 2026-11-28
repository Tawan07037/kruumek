import { jsonResponse } from "../_lib/http.js";

export async function onRequestGet() {
  return jsonResponse({
    success: true,
    service: "krumek-api",
    status: "online"
  });
}
