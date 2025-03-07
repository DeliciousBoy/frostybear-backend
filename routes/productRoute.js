import express from "express";
// import { getAllProduct, postProduct, getProductById, putProductm, deleteProduct } from '../controllers/productController.js';
import * as productC from '../controllers/productController.js';

const router = express.Router()

router.get('/products', productC.getAllProduct)

export default router