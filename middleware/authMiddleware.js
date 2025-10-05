function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.render("403", { error: "You have to login first to get access" });
}

module.exports = isAuthenticated;