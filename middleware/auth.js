function requireAdmin(req, res, next) {
  if (req.signedCookies.admin_session === "authenticated") {
    return next();
  }
  return res.redirect("/admin/login");
}

module.exports = { requireAdmin };
