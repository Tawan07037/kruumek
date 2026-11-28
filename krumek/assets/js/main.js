/**
 * Application entry point. Loads the original simulator modules in order.
 */
import { K } from "./data/device-types.js";
import { D, byId, L, GP, initializeNetworkModel } from "./network/model.js";
import {
  initializeRouting, dirty, tbl, route, reach, pchain, dns,
  st, SL, ipOf, mac, upt, bw, cpu
} from "./network/routing.js";
import { initializeLegacyApp } from "./core/legacy-app.js";
import { initializeRecommendations } from "./ui/recommendations.js";

function startKruumek() {
  initializeNetworkModel();
  initializeRouting();

  initializeLegacyApp({
    K, D, byId, L, GP,
    dirty, tbl, route, reach, pchain, dns,
    st, SL, ipOf, mac, upt, bw, cpu
  });

  initializeRecommendations({ D });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startKruumek, { once: true });
} else {
  startKruumek();
}
