const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");
const supabase = require("../config/supabase");
const { requireAdmin } = require("../middleware/auth");
const { uploadImages, deleteImage } = require("../config/storage");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

router.get("/login", (req, res) => {
  if (req.session.isAdmin) return res.redirect("/admin");
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

  req.session.isAdmin = true;
  res.redirect("/admin");
});

router.post("/logout", (req, res) => {
  req.session = null;
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

module.exports = router;
