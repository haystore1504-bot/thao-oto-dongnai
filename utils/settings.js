const supabase = require("../config/supabase");

let cache = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 30 * 1000;

const DEFAULT_SETTINGS = {
  hero_slides: [],
  hotline: "0900.000.000",
  address: "Đang cập nhật, Đồng Nai",
  email: "lienhe@thaootodongnai.vn",
  working_hours: "Thứ 2 - Thứ 7: 8:00 - 18:00, Chủ nhật: 8:00 - 12:00",
  logo_url: null,
  logo_path: null,
};

async function getSettings() {
  if (cache && Date.now() < cacheExpiresAt) return cache;

  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  cache = data || DEFAULT_SETTINGS;
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return cache;
}

function clearSettingsCache() {
  cache = null;
  cacheExpiresAt = 0;
}

module.exports = { getSettings, clearSettingsCache };
