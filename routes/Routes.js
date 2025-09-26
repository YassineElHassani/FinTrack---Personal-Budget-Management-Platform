const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");

router.get("/", UserController.renderHomePage);
router.post('/register', UserController.register);
router.get('/login', UserController.login);
router.get('/logout/:id', UserController.logout);

module.exports = router;