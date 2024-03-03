import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import Review from "../models/reviewModel.js";
import User from "../models/userModel.js";
import fs from "fs";
import axios from "axios";
class ProductsController {
  static async createProduct(req, res) {
    try {
      const { name, price, description, curators_pick, categoryId } = req.body;
      const image = req.file;
      const errors = [];

      if (!name || !price || !description || !image || !categoryId) {
        errors.push("All fields are required");
      }

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const imageData = fs.readFileSync(image.path);

      const freeImageResponse = await axios.post(
        "https://freeimage.host/api/1/upload",
        {
          key: "6d207e02198a847aa98d0a2a901485a5",
          action: "upload",
          source: imageData.toString("base64"),
          format: "json",
        }
      );

      const imageUrl = freeImageResponse.data.image.url;

      const newProduct = await Product.create({
        name,
        price,
        description,
        image: imageUrl,
        curators_pick,
        categoryId,
      });

      if (!newProduct) {
        errors.push("Error creating product");
        return res.status(500).json({ errors });
      }

      return res.status(201).json({ newProduct });
    } catch (error) {
      console.log("=====================================");
      console.log(JSON.stringify(error));
      console.log(error.message);
      console.log("=====================================");
      return res.status(500).json({ message: error.message });
    }
  }

  static async getAllProducts(req, res) {
    try {
      const products = await Product.findAll({
        include: Review, // Include associated reviews
      });
      if (products.length === 0) {
        return res.status(404).json("There are no available products");
      }
      return res.status(200).json(products);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async updateProduct(req, res) {
    console.log(req.body);
    try {
      const { id } = req.params;
      const { name, price, description, curators_pick } = req.body;
      const errors = [];

      if (!name || !price || !description) {
        errors.push("All fields are required");
      }

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      product.name = name;
      product.price = price;
      product.description = description;
      product.curators_pick = curators_pick;

      await product.save();

      return res.status(200).json({ product });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      await product.destroy();

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async getProductsByCategory(req, res) {
    try {
      const { categoryName } = req.params;

      if (categoryName.toLowerCase() === "all") {
        const products = await Product.findAll();
        return res.status(200).json(products);
      }

      const category = await Category.findOne({
        where: {
          name: categoryName,
        },
      });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const products = await Product.findAll({
        where: {
          categoryId: category.id,
        },
      });

      if (products.length === 0) {
        return res.status(404).json("There are no products in this category");
      }

      return res.status(200).json(products);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async getCuratorsPickProducts(req, res) {
    try {
      const products = await Product.findAll({
        where: {
          curators_pick: true,
        },
      });

      if (products.length === 0) {
        return res
          .status(404)
          .json("There are no products marked as curators' pick");
      }

      return res.status(200).json(products);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async getOneProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id, {
        include: [
          {
            model: Review,
            include: [User], // Include User model within Review model
          },
        ],
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      return res.status(200).json(product);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default ProductsController;
