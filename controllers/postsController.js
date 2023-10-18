const Producte = require('../models/Producte');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const uuid = require('uuid');
const path = require('path');
const fs = require('fs');

class PostsController {
    async addProduct(req,res) {
        try {
            const { title, description, price, categoryID} = req.body;

            if (!req.files || Object.keys(req.files).length === 0) {
              return res.status(400).json({ message: 'File not uploaded. Please choose a file to upload.' });
            }
            
            if(!title || !description || !price) {
                return res.status(400).json({ message: 'Empty string provided. Please provide valid content.'})
            }
            const photoArray = [];
            const img = req.files.image;
            
            const uploadPromises = [];
  
            for (let i = 0; i < img.length; i++) {
              
                const file = img[i];
                
                const fileName = uuid.v4() + '.jpg';
                // const filePath = path.resolve('static', fileName);
                const filePath = 'public/' + fileName; 
            
                const uploadPromise = new Promise((resolve, reject) => {
                  file.mv(filePath, (err) => {
                    if (err) {
                      reject(err);
                    } else {
                      const photo = {
                        url: filePath,
                        description: 'Image description',
                        isMain: false,
                      };
                      photoArray.push(photo);
                      resolve();
                    }
                  });
                });
            
                uploadPromises.push(uploadPromise);
              
            }
            
            Promise.all(uploadPromises)
              .then(async () => {
                const newProduct = new Producte({
                  title,
                  description,
                  price,
                  photos: photoArray,
                });
            
                await newProduct.save()
                try {
                  const updatedCategory = await Category.findOneAndUpdate(
                    { _id: categoryID },
                    { $push: { products: newProduct._id } },
                    { new: true }
                  );
                
                  if (!updatedCategory) {
                    return res.status(500).json({ message: 'Ошибка при добавлении продукта в категорию' });
                  }
                
                  return res.status(201).json({ message: 'Продукт успешно добавлен в категорию' });
                } catch (error) {
                  console.error(error);
                  return res.status(500).json({ message: 'Ошибка при добавлении продукта в категорию' });
                }
                return res.status(201).json({ message: 'Post created successfully.' });
              })
          } catch (error) {
            return res.json(error);
          }
    }

    async deleteProduct(req, res) { 
        try {
            const _id = req.query.id;
            const post = await Producte.findById(_id);
        
            if (!post) {
              return res.status(404).json({ message: 'Пост не найден.' });
            }
            for (const photo of post.photos) {
              fs.unlinkSync(photo.url);
            }
        
            await Producte.findOneAndDelete({ _id });
        
            return res.json({ message: 'Пост и связанные фотографии удалены' });
          } catch (error) {
            return res.status(500).json({ message: 'Ошибка при удалении поста и фотографий.' });
          }
    }

    async getAllProducts(req, res) {
        try {
             //get page number from request
             const page = parseInt(req.query.page) || 1;
             //set a limit of elements //parseInt(req.query.limit) for user
             const limit = 2;
             //Calculate how many elements to skip
             const skip = (page - 1) * limit;
 
             //count users db document
             const totalCount = await Producte.countDocuments();
 
             //get users from db
             const posts = await Producte.find().skip(skip).limit(limit)
 
             if(posts.length < 1) {
                  return res.status(404).json({message: "Data not found on the page."});
             }
 
             //send response json 
             return res.json({
                posts,
                currentPage: page,
                totalPage: Math.ceil(totalCount / limit),
             });
        } catch (error) {
            console.log(error)
        }
    }
    async getProductById(req, res) {
      try {
        const _id = req.query.id;
        const producte = await Producte.findById(_id);
          return res.status(200).json({ producte });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
      }
    }

    async addCategory(req,res) {
      try {
          const { name } = req.body;

          if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ message: 'File not uploaded. Please choose a file to upload.' });
          }
          
          if(!name) {
              return res.status(400).json({ message: 'Empty string provided. Please provide valid content.'})
          }

          
          const file = req.files.image;
          const fileName = uuid.v4() + '.jpg';
          const filePath = 'static/' + fileName; 
          file.mv(filePath, (err) => {
          if (err) {
          return res.status(500).json({ message: 'File upload failed.' });
         }
          const newCategory = new Category({
                name,
                photo: filePath
          });
          newCategory.save();
        })
    
          return res.status(201).json({ message: 'Post created successfully.' });
        } catch (error) {
          return res.json(error);
        }
    }
  
    async getAllProductsInCategory(req,res) {
      const { id, skip, limit} = req.query;
      if(skip<0||limit<0) return res.json({message:"errors"})
      const ObjectId = mongoose.Types.ObjectId;
      const categoryId = new ObjectId(id);
      const category = await Category.findById(categoryId).populate({
      path: 'products',
      options: {skip: parseInt(skip), limit: parseInt(limit)}
      });
      if (!category) {
        return res.status(404).json({ message: 'Категория не найдена' });
      }
      const productsInCategory = category.products;
      console.log(productsInCategory);
      return res.json(productsInCategory);
    }

}

module.exports = new PostsController();
