import {
  getAdminIdentity,
  getAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  archiveAnnouncement,
  getAdminAudit
} from "../services/api.js";

const $ = (id) => document.getElementById(id);
let currentIdentity = null;

function message(text, type = "info") {
  const element = $("message");
  element.textContent = text;
  element.className = type === "error" ? "notice status err" : "notice";
}

function resetForm() {
  $("announcementId").value = "";
  $("title").value = "";
  $("content").value = "";
  $("status").value = "draft";
  $("formTitle").textContent = "สร้างประกาศ";
}

function renderAnnouncements(items) {
  const root = $("announcements");
  root.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "ยังไม่มีประกาศ";
    root.append(empty);
    return;
  }

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "item";

    const top = document.createElement("div");
    top.className = "row";

    const title = document.createElement("h3");
    title.textContent = item.title;

    const state = document.createElement("span");
    state.className = "status";
    state.textContent = item.status;

    top.append(title, state);

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `ผู้สร้าง: ${item.created_by_email} · แก้ไขล่าสุด: ${item.updated_at}`;

    const content = document.createElement("p");
    content.textContent = item.content;

    const actions = document.createElement("div");
    actions.className = "actions";

    if (currentIdentity.role !== "viewer") {
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "secondary";
      edit.textContent = "แก้ไข";
      edit.addEventListener("click", () => {
        $("announcementId").value = item.id;
        $("title").value = item.title;
        $("content").value = item.content;
        $("status").value = item.status === "published" ? "published" : "draft";
        $("formTitle").textContent = "แก้ไขประกาศ";
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      actions.append(edit);
    }

    if (["publisher", "admin"].includes(currentIdentity.role)) {
      const archive = document.createElement("button");
      archive.type = "button";
      archive.className = "danger";
      archive.textContent = "เก็บเข้าคลัง";
      archive.addEventListener("click", async () => {
        if (!window.confirm(`ต้องการเก็บประกาศ "${item.title}" หรือไม่?`)) return;
        try {
          await archiveAnnouncement(item.id);
          message("เก็บประกาศเข้าคลังแล้ว", "ok");
          await loadAnnouncements();
          if (["publisher", "admin"].includes(currentIdentity.role)) {
            await loadAudit();
          }
        } catch (error) {
          message(error.message, "error");
        }
      });
      actions.append(archive);
    }

    card.append(top, meta, content, actions);
    root.append(card);
  }
}

async function loadAnnouncements() {
  const response = await getAdminAnnouncements();
  renderAnnouncements(response.data || []);
}

async function loadAudit() {
  const response = await getAdminAudit(50);
  const root = $("audit");
  root.replaceChildren();

  if (!response.data?.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "ยังไม่มี Audit Log";
    root.append(empty);
    return;
  }

  for (const record of response.data) {
    const row = document.createElement("div");
    row.className = "item";
    const heading = document.createElement("strong");
    heading.textContent = `${record.action} — ${record.resource_id || "-"}`;
    const detail = document.createElement("div");
    detail.className = "meta";
    detail.textContent = `${record.actor_email} · ${record.created_at}`;
    row.append(heading, detail);
    root.append(row);
  }
}

async function start() {
  try {
    currentIdentity = await getAdminIdentity();
    $("identity").textContent = `${currentIdentity.email} · ${currentIdentity.role || "ยังไม่ได้กำหนด Role"}`;

    if (!currentIdentity.provisioned) {
      message(
        "เข้าสู่ระบบผ่าน Cloudflare Access แล้ว แต่ยังไม่มี Role ในฐานข้อมูล กรุณาเพิ่ม subject ของผู้ดูแลใน admin_roles ตามคู่มือ",
        "error"
      );
      return;
    }

    $("app").classList.remove("hidden");
    if (currentIdentity.role === "viewer") {
      $("formPanel").classList.add("hidden");
    }
    if (!["publisher", "admin"].includes(currentIdentity.role)) {
      $("status").querySelectorAll('option[value="published"]').forEach((option) => {
        option.disabled = true;
      });
      $("auditPanel").classList.add("hidden");
    }
    message("ยืนยันตัวตนสำเร็จ");
    await loadAnnouncements();
  } catch (error) {
    message(error.message || "ไม่สามารถเปิดหน้าผู้ดูแลได้", "error");
  }
}

$("announcementForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = $("announcementId").value.trim();
  const payload = {
    title: $("title").value,
    content: $("content").value,
    status: $("status").value
  };

  try {
    if (id) {
      await updateAnnouncement({ id, ...payload });
      message("แก้ไขประกาศแล้ว");
    } else {
      await createAnnouncement(payload);
      message("สร้างประกาศแล้ว");
    }
    resetForm();
    await loadAnnouncements();
    if (["publisher", "admin"].includes(currentIdentity.role)) {
      await loadAudit();
    }
  } catch (error) {
    message(error.message, "error");
  }
});

$("cancelEdit").addEventListener("click", resetForm);
$("reload").addEventListener("click", () => loadAnnouncements().catch((error) => message(error.message, "error")));
$("reloadAudit").addEventListener("click", () => loadAudit().catch((error) => message(error.message, "error")));

start();
