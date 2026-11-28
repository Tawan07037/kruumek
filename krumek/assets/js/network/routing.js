/**
 * Routing and derived status for the browser-side network simulator.
 * This is a simulation only; it does not poll or secure real network devices.
 */
import { K } from "../data/device-types.js";
import { D, byId, L } from "./model.js";

let adj = Object.create(null);
let RT = null;

export function initializeRouting() {
  adj = Object.create(null);
  D.forEach((device) => { adj[device.id] = []; });
  L.forEach((link) => {
    const weight = link.isl ? 0.5 : link.bk ? 3 : 1;
    adj[link.a].push([link.b, weight]);
    adj[link.b].push([link.a, weight]);
  });
  RT = null;
}

export const dirty = () => { RT = null; };

export function tbl() {
  if (RT) return RT;
  const dist = { net: 0 };
  const prev = {};
  const queue = ["net"];
  const visited = {};

  while (queue.length) {
    queue.sort((a, b) => dist[a] - dist[b]);
    const current = queue.shift();
    if (visited[current]) continue;
    visited[current] = true;
    for (const [next, weight] of (adj[current] || [])) {
      if (!byId[next]?.up) continue;
      const nextDistance = dist[current] + weight;
      if (dist[next] === undefined || nextDistance < dist[next]) {
        dist[next] = nextDistance;
        prev[next] = current;
        queue.push(next);
      }
    }
  }
  RT = { dist, prev };
  return RT;
}

export const route = (id) => {
  if (!byId[id]?.up) return null;
  const { dist, prev } = tbl();
  if (dist[id] === undefined) return null;
  const path = [id];
  while (path[path.length - 1] !== "net") {
    const parent = prev[path[path.length - 1]];
    if (!parent) return null;
    path.push(parent);
  }
  return path;
};

export const reach = (id) => !!route(id);

export const pchain = (id) => {
  const chain = [];
  for (let device = byId[id]; device; device = byId[device.p[0]]) {
    chain.push(device.id);
  }
  return chain;
};

export const dns = () => !!(byId.srv1?.up || byId.srv2?.up);

export const st = (device) =>
  !device.up ? "down" :
  !reach(device.id) ? "iso" :
  (((K[device.k]?.dh || device.k === "ap") && !dns()) ||
    (device.k === "ap" && (!byId.wlc?.up || !byId.auth?.up))) ? "warn" :
  pchain(device.id).some((id) => !byId[id]?.up) ? "bk" : "ok";

export const SL = {
  ok: "ทำงานปกติ",
  bk: "ใช้เส้นทางสำรอง (Failover)",
  warn: "ทำงานได้บางส่วน",
  iso: "ออกอินเทอร์เน็ตไม่ได้",
  down: "ปิดอยู่"
};

export const ipOf = (device) =>
  device.ip ||
  (K[device.k]?.dh ? "DHCP" :
    device.k === "cam" ? "10.50.0." + (10 + D.indexOf(device)) :
    "10.0.1." + (10 + D.indexOf(device)));

export const mac = (id) => {
  const hash = [...id].reduce(
    (value, char) => (value * 131 + char.charCodeAt(0)) >>> 0,
    7
  );
  return [0, 1, 2, 3, 4, 5]
    .map((index) => ((hash >>> (index * 5)) & 255).toString(16).padStart(2, "0"))
    .join(":");
};

export const upt = (device) => {
  if (!device.up) return "ปิดอยู่";
  const seconds = ((Date.now() - device.since) / 1000) | 0;
  return Math.floor(seconds / 60) + " นาที " + (seconds % 60) + " วินาที";
};

export const bw = (device) =>
  device.up ? (K[device.k].c * device.load / 100).toFixed(1) + " / " + K[device.k].c + " Mbps" : "-";

export const cpu = (device) =>
  device.up ? Math.min(99, 6 + device.load * 0.7 + Math.random() * 3 | 0) + "%" : "-";
