import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/productService.js';

export const getProducts = async (req, res, next) => {
  try {
    const { search } = req.query;
    const organizationId = req.user.organizationId;
    const defaultThreshold = req.user.organization.defaultLowStockThreshold;

    const products = await listProducts({
      organizationId,
      search,
      defaultThreshold,
    });

    res.json({ products });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const defaultThreshold = req.user.organization.defaultLowStockThreshold;

    const product = await getProductById({ id, organizationId, defaultThreshold });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
};

export const createProductHandler = async (req, res, next) => {
  try {
    const { name, sku, description, quantityOnHand, costPrice, sellingPrice, lowStockThreshold } = req.body;
    const organizationId = req.user.organizationId;
    const defaultThreshold = req.user.organization.defaultLowStockThreshold;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required.' });
    }

    if (!sku || !sku.trim()) {
      return res.status(400).json({ error: 'Product SKU is required.' });
    }

    const qty = quantityOnHand !== undefined && quantityOnHand !== '' ? Number(quantityOnHand) : 0;
    if (isNaN(qty) || !Number.isInteger(qty) || qty < 0) {
      return res.status(400).json({ error: 'Quantity on hand must be a non-negative integer.' });
    }

    if (costPrice !== undefined && costPrice !== null && costPrice !== '') {
      const cp = Number(costPrice);
      if (isNaN(cp) || cp < 0) {
        return res.status(400).json({ error: 'Cost price must be a non-negative number.' });
      }
    }

    if (sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== '') {
      const sp = Number(sellingPrice);
      if (isNaN(sp) || sp < 0) {
        return res.status(400).json({ error: 'Selling price must be a non-negative number.' });
      }
    }

    if (lowStockThreshold !== undefined && lowStockThreshold !== null && lowStockThreshold !== '') {
      const lst = Number(lowStockThreshold);
      if (isNaN(lst) || !Number.isInteger(lst) || lst < 0) {
        return res.status(400).json({ error: 'Low-stock threshold must be a non-negative integer.' });
      }
    }

    const product = await createProduct({
      organizationId,
      name,
      sku,
      description,
      quantityOnHand: qty,
      costPrice,
      sellingPrice,
      lowStockThreshold,
      defaultThreshold,
    });

    res.status(201).json({
      message: 'Product created successfully.',
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, sku, description, quantityOnHand, costPrice, sellingPrice, lowStockThreshold } = req.body;
    const organizationId = req.user.organizationId;
    const defaultThreshold = req.user.organization.defaultLowStockThreshold;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: 'Product name cannot be empty.' });
    }

    if (sku !== undefined && !sku.trim()) {
      return res.status(400).json({ error: 'Product SKU cannot be empty.' });
    }

    if (quantityOnHand !== undefined) {
      const qty = Number(quantityOnHand);
      if (isNaN(qty) || !Number.isInteger(qty) || qty < 0) {
        return res.status(400).json({ error: 'Quantity on hand must be a non-negative integer.' });
      }
    }

    if (costPrice !== undefined && costPrice !== null && costPrice !== '') {
      const cp = Number(costPrice);
      if (isNaN(cp) || cp < 0) {
        return res.status(400).json({ error: 'Cost price must be a non-negative number.' });
      }
    }

    if (sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== '') {
      const sp = Number(sellingPrice);
      if (isNaN(sp) || sp < 0) {
        return res.status(400).json({ error: 'Selling price must be a non-negative number.' });
      }
    }

    if (lowStockThreshold !== undefined && lowStockThreshold !== null && lowStockThreshold !== '') {
      const lst = Number(lowStockThreshold);
      if (isNaN(lst) || !Number.isInteger(lst) || lst < 0) {
        return res.status(400).json({ error: 'Low-stock threshold must be a non-negative integer.' });
      }
    }

    const updatedProduct = await updateProduct({
      id,
      organizationId,
      name,
      sku,
      description,
      quantityOnHand,
      costPrice,
      sellingPrice,
      lowStockThreshold,
      defaultThreshold,
    });

    res.json({
      message: 'Product updated successfully.',
      product: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const result = await deleteProduct({ id, organizationId });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

