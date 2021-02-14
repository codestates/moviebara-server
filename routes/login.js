const express = require('express')
const router = express.Router();
const controller = require('../controller/login')

router.post('/', controller.post)
router.post('/googleLogin', controller.googleLogin)
router.post('/nonMember', controller.nonMemberLogin)

module.exports = router;