const Router = require('express')
const router = new Router()
const controller = require('../controllers/postsController')
const authMiddleware = require('../middlewaree/authMiddleware')
const roleMiddleware = require('../middlewaree/roleMiddleware')

//get products and delete products
router.post('/addproduct',controller.addProduct)
router.delete('/deleteproduct',controller.deleteProduct)
router.get('/getallproducts', controller.getAllProducts)
router.get('/getproductbyid',authMiddleware,roleMiddleware(['ADMIN']), controller.getProductById)

router.post('/addcategory', controller.addCategory)
router.get('/getproductsincategory', controller.getAllProductsInCategory)
module.exports = router