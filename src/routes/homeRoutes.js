const express = require('express');
const houseController = require('../controllers/homeController');

const router = express.Router();


// Authorization routes
router.get('/', houseController.home);
router.get('/about',houseController.about);
router.get('/contact',houseController.contact)
router.get('/dashboard',(req,res)=>{
    res.redirect('/student/dashboard')
})


module.exports = router;
