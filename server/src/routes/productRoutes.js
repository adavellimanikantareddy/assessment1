import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} from '../controllers/productController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All product routes require authentication
router.use(requireAuth);

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', createProductHandler);
router.put('/:id', updateProductHandler);
router.delete('/:id', deleteProductHandler);

export default router;

