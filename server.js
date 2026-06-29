require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const path = require("path");
const { getSettings } = require("./utils/settings");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser(process.env.SESSION_SECRET));

app.use(async (req, res, next) => {
  res.locals.isAdmin = req.signedCookies.admin_session === "authenticated";
  res.locals.settings = await getSettings();
  next();
});

app.use("/", require("./routes/site"));
app.use("/admin", require("./routes/admin"));

app.use((req, res) => {
  res.status(404).render("404");
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
  });
}

module.exports = app;
