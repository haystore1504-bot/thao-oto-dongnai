const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const { getYoutubeEmbedUrl } = require("../utils/youtube");

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

  res.render("home", { featuredCars: featuredCars || [], latestCars: latestCars || [] });
});

router.get("/xe", async (req, res) => {
  const { brand, minPrice, maxPrice, q } = req.query;
  let query = supabase.from("cars").select("*").order("created_at", { ascending: false });

  if (brand) query = query.eq("brand", brand);
  if (q) query = query.ilike("name", `%${q}%`);
  if (minPrice) query = query.gte("price", Number(minPrice));
  if (maxPrice) query = query.lte("price", Number(maxPrice));

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

module.exports = router;
