import express from "express";
// import { getAllProduct, postProduct, getProductById, putProductm, deleteProduct } from '../controllers/productController.js';
import * as productC from '../controllers/productController.js';

const router = express.Router()

router.get('/products', productC.getAllProduct)
router.get('/trends/products', productC.getTrendProduct)
router.get('/products/:id', productC.getProductById)
router.post('/products', productC.postProduct)
router.put('/products/:id', productC.putProduct)
router.delete('/products/:id', productC.deleteProduct)

export default router