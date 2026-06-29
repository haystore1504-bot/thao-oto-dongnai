const express = require("express");
const router = express.Router();
const multer = require("multer");
const supabase = require("../config/supabase");
const { getYoutubeEmbedUrl } = require("../utils/youtube");
const { uploadImages } = require("../config/storage");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

router.get("/", async (req, res) => {
  const { data: featuredCars } = await supabase
    .from("cars")
    .select("*")
    .eq("is_featured", true)
    .eq("is_sold", false)
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: latestCars } = await supabase
    .from("cars")
    .select("*")
    .eq("is_sold", false)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  res.render("home", {
    featuredCars: featuredCars || [],
    latestCars: latestCars || [],
    testimonials: testimonials || [],
  });
});

router.get("/xe", async (req, res) => {
  const { brand, minPrice, maxPrice, q, sort } = req.query;
  let query = supabase.from("cars").select("*");

  if (brand) query = query.eq("brand", brand);
  if (q) query = query.ilike("name", `%${q}%`);
  if (minPrice) query = query.gte("price", Number(minPrice));
  if (maxPrice) query = query.lte("price", Number(maxPrice));

  if (sort === "price_asc") query = query.order("price", { ascending: true });
  else if (sort === "price_desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data: cars } = await query;

  const { data: allBrands } = await supabase.from("cars").select("brand");
  const brands = [...new Set((allBrands || []).map((c) => c.brand))];

  res.render("cars", { cars: cars || [], brands, query: req.query });
});

router.get("/xe/:id", async (req, res) => {
  const { data: car } = await supabase.from("cars").select("*").eq("id", req.params.id).single();
  if (!car) return res.status(404).render("404");

  const embedUrl = getYoutubeEmbedUrl(car.youtube_url);

  const { data: relatedCars } = await supabase
    .from("cars")
    .select("*")
    .eq("brand", car.brand)
    .neq("id", car.id)
    .limit(4);

  res.render("car-detail", { car, embedUrl, relatedCars: relatedCars || [] });
});

router.get("/lien-he", (req, res) => {
  res.render("contact");
});

router.get("/ban-xe", (req, res) => {
  res.render("sell-car", { success: false, error: null });
});

router.post("/ban-xe", upload.array("images", 6), async (req, res) => {
  const { fullName, phone, email, brand, modelYear, mileageKm, description } = req.body;

  if (!fullName || !phone) {
    return res.render("sell-car", { success: false, error: "Vui lòng nhập đầy đủ họ tên và số điện thoại." });
  }

  const images = await uploadImages(req.files);

  await supabase.from("sell_requests").insert({
    full_name: fullName,
    phone,
    email: email || null,
    brand: brand || null,
    model_year: modelYear ? Number(modelYear) : null,
    mileage_km: mileageKm ? Number(mileageKm) : null,
    description: description || null,
    images,
  });

  res.render("sell-car", { success: true, error: null });
});

module.exports = router;
