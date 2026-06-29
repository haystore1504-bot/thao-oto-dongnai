const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");
const supabase = require("../config/supabase");
const { requireAdmin } = require("../middleware/auth");
const { uploadImages, deleteImage } = require("../config/storage");
const { getSettings, clearSettingsCache } = require("../utils/settings");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  signed: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 8,
};

router.get("/login", (req, res) => {
  if (req.signedCookies.admin_session === "authenticated") return res.redirect("/admin");
  res.render("admin/login", { error: null });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const validUsername = username === process.env.ADMIN_USERNAME;
  const validPassword =
    validUsername &&
    process.env.ADMIN_PASSWORD_HASH &&
    (await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH));

  if (!validUsername || !validPassword) {
    return res.render("admin/login", { error: "Sai tên đăng nhập hoặc mật khẩu" });
  }

  res.cookie("admin_session", "authenticated", SESSION_COOKIE_OPTIONS);
  res.redirect("/admin");
});

router.post("/logout", (req, res) => {
  res.clearCookie("admin_session");
  res.redirect("/admin/login");
});

router.use(requireAdmin);

router.get("/", async (req, res) => {
  const { data: cars } = await supabase.from("cars").select("*").order("created_at", { ascending: false });
  res.render("admin/dashboard", { cars: cars || [] });
});

router.get("/xe/them", (req, res) => {
  res.render("admin/car-form", { car: null });
});

router.post("/xe/them", upload.array("images", 10), async (req, res) => {
  const images = await uploadImages(req.files);

  await supabase.from("cars").insert({
    name: req.body.name,
    brand: req.body.brand,
    year: Number(req.body.year),
    mileage_km: Number(req.body.mileageKm),
    price: Number(req.body.price),
    transmission: req.body.transmission,
    fuel: req.body.fuel,
    color: req.body.color || null,
    description: req.body.description || null,
    youtube_url: req.body.youtubeUrl || null,
    is_featured: req.body.isFeatured === "on",
    images,
  });

  res.redirect("/admin");
});

router.get("/xe/:id/sua", async (req, res) => {
  const { data: car } = await supabase.from("cars").select("*").eq("id", req.params.id).single();
  if (!car) return res.status(404).render("404");
  res.render("admin/car-form", { car });
});

router.put("/xe/:id", upload.array("images", 10), async (req, res) => {
  const { data: car } = await supabase.from("cars").select("*").eq("id", req.params.id).single();
  if (!car) return res.status(404).render("404");

  const newImages = await uploadImages(req.files);
  const images = [...(car.images || []), ...newImages];

  await supabase
    .from("cars")
    .update({
      name: req.body.name,
      brand: req.body.brand,
      year: Number(req.body.year),
      mileage_km: Number(req.body.mileageKm),
      price: Number(req.body.price),
      transmission: req.body.transmission,
      fuel: req.body.fuel,
      color: req.body.color || null,
      description: req.body.description || null,
      youtube_url: req.body.youtubeUrl || null,
      is_sold: req.body.isSold === "on",
      is_featured: req.body.isFeatured === "on",
      images,
      updated_at: new Date().toISOString(),
    })
    .eq("id", car.id);

  res.redirect("/admin");
});

router.delete("/xe/:id/anh", async (req, res) => {
  const { data: car } = await supabase.from("cars").select("*").eq("id", req.params.id).single();
  if (!car) return res.status(404).render("404");

  const targetPath = req.query.path;
  await deleteImage(targetPath);
  const images = (car.images || []).filter((img) => img.path !== targetPath);

  await supabase.from("cars").update({ images }).eq("id", car.id);
  res.redirect(`/admin/xe/${car.id}/sua`);
});

router.delete("/xe/:id", async (req, res) => {
  const { data: car } = await supabase.from("cars").select("*").eq("id", req.params.id).single();
  if (!car) return res.status(404).render("404");

  for (const img of car.images || []) {
    await deleteImage(img.path);
  }
  await supabase.from("cars").delete().eq("id", car.id);
  res.redirect("/admin");
});

router.get("/cai-dat", async (req, res) => {
  const settings = await getSettings();
  res.render("admin/settings", { settings });
});

router.post(
  "/cai-dat",
  upload.fields([
    { name: "heroImages", maxCount: 8 },
    { name: "logoImage", maxCount: 1 },
  ]),
  async (req, res) => {
    const settings = await getSettings();
    const heroFiles = (req.files && req.files.heroImages) || [];
    const logoFiles = (req.files && req.files.logoImage) || [];

    const newSlides = await uploadImages(heroFiles);
    const keepPaths = [].concat(req.body.keepSlide || []);
    const keptSlides = (settings.hero_slides || []).filter((s) => keepPaths.includes(s.path));
    const slides = [...keptSlides, ...newSlides];

    const removedSlides = (settings.hero_slides || []).filter((s) => !keepPaths.includes(s.path));
    for (const s of removedSlides) {
      await deleteImage(s.path);
    }

    const update = {
      hero_slides: slides,
      hotline: req.body.hotline,
      address: req.body.address,
      email: req.body.email,
      working_hours: req.body.workingHours,
      updated_at: new Date().toISOString(),
    };

    if (req.body.removeLogo === "on" && settings.logo_path) {
      await deleteImage(settings.logo_path);
      update.logo_url = null;
      update.logo_path = null;
    } else if (logoFiles.length) {
      if (settings.logo_path) await deleteImage(settings.logo_path);
      const [uploadedLogo] = await uploadImages(logoFiles);
      update.logo_url = uploadedLogo.url;
      update.logo_path = uploadedLogo.path;
    }

    await supabase.from("site_settings").update(update).eq("id", 1);

    clearSettingsCache();
    res.redirect("/admin/cai-dat");
  }
);

router.get("/yeu-cau-ban-xe", async (req, res) => {
  const { data: requests } = await supabase
    .from("sell_requests")
    .select("*")
    .order("created_at", { ascending: false });
  res.render("admin/sell-requests", { requests: requests || [] });
});

router.put("/yeu-cau-ban-xe/:id", async (req, res) => {
  await supabase.from("sell_requests").update({ status: req.body.status }).eq("id", req.params.id);
  res.redirect("/admin/yeu-cau-ban-xe");
});

router.delete("/yeu-cau-ban-xe/:id", async (req, res) => {
  const { data: request } = await supabase.from("sell_requests").select("*").eq("id", req.params.id).single();
  if (request) {
    for (const img of request.images || []) {
      await deleteImage(img.path);
    }
  }
  await supabase.from("sell_requests").delete().eq("id", req.params.id);
  res.redirect("/admin/yeu-cau-ban-xe");
});

router.get("/danh-gia", async (req, res) => {
  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  res.render("admin/testimonials", { testimonials: testimonials || [] });
});

router.get("/danh-gia/them", (req, res) => {
  res.render("admin/testimonial-form", { testimonial: null });
});

router.post("/danh-gia/them", async (req, res) => {
  await supabase.from("testimonials").insert({
    customer_name: req.body.customerName,
    car_name: req.body.carName || null,
    rating: Number(req.body.rating),
    content: req.body.content,
    display_order: Number(req.body.displayOrder) || 0,
  });
  res.redirect("/admin/danh-gia");
});

router.get("/danh-gia/:id/sua", async (req, res) => {
  const { data: testimonial } = await supabase.from("testimonials").select("*").eq("id", req.params.id).single();
  if (!testimonial) return res.status(404).render("404");
  res.render("admin/testimonial-form", { testimonial });
});

router.put("/danh-gia/:id", async (req, res) => {
  await supabase
    .from("testimonials")
    .update({
      customer_name: req.body.customerName,
      car_name: req.body.carName || null,
      rating: Number(req.body.rating),
      content: req.body.content,
      display_order: Number(req.body.displayOrder) || 0,
    })
    .eq("id", req.params.id);
  res.redirect("/admin/danh-gia");
});

router.delete("/danh-gia/:id", async (req, res) => {
  await supabase.from("testimonials").delete().eq("id", req.params.id);
  res.redirect("/admin/danh-gia");
});

module.exports = router;
