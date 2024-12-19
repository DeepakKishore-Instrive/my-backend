import express, { json } from 'express';
import mongoose from 'mongoose';
import Data from './model/data_model.js';
import { Category, SubCategory } from "./model/category_model.js";
import User from "./model/user_model.js"
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";

const app = express();
const port = 3000;

const localIP = "192.168.0.111"


app.use(express.json());

//
const mongoURI = "mongodb+srv://deepakkishore:sdk1612.@cluster0.hqz43.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

app.get('/', (req, res) => {
    res.send('Hello, World!');
});
mongoose.connect(mongoURI)
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });


app.get('/api/data', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;


    Data.countDocuments()
        .then((totalCount) => {
            const totalPages = Math.ceil(totalCount / limit);
            const hasNextPage = page < totalPages;


            Data.find()
                .skip(skip)
                .limit(limit)
                .then((data) => {
                    res.status(200).json({
                        data,
                        pagination: {
                            totalCount,
                            totalPages,
                            currentPage: page,
                            limit,
                            hasNextPage,
                        },
                    });
                })
                .catch((err) => {
                    res.status(500).json({ message: 'Error fetching data', error: err });
                });
        })
        .catch((err) => {
            res.status(500).json({ message: 'Error counting documents', error: err });
        });
});



app.post('/api/data', (req, res) => {
    const { name, age } = req.body;


    if (name && age) {
        const newData = new Data({ name, age });
        newData.save()
            .then((data) => {
                res.status(200).json({ message: 'Data saved successfully', data });
            })
            .catch((err) => {
                res.status(500).json({ message: 'Error saving data', error: err });
            });
    } else {
        res.status(400).json({ message: 'Missing name or age' });
    }
});

app.put('/api/data/:id', (req, res) => {
    const { id } = req.params;
    const updateFields = req.body;


    if (!updateFields || Object.keys(updateFields).length === 0) {
        return res.status(400).json({ message: 'No data provided to update' });
    }


    Data.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true })
        .then((updatedData) => {
            if (!updatedData) {
                return res.status(404).json({ message: 'Data not found' });
            }
            res.status(200).json({ message: 'Data updated successfully', data: updatedData });
        })
        .catch((err) => {
            res.status(500).json({ message: 'Error updating data', error: err });
        });
});

app.delete('/api/data/:id', (req, res) => {
    const { id } = req.params;


    Data.findByIdAndDelete(id)
        .then((data) => {
            if (!data) {
                return res.status(404).json({ message: 'Data not found' });
            }
            res.status(200).json({ message: 'Data deleted successfully', data });
        })
        .catch((err) => {
            res.status(500).json({ message: 'Error fetching data', error: err });
        });
});

app.get('/api/data/:id', (req, res) => {
    const { id } = req.params;


    Data.findById(id)
        .then((data) => {
            if (!data) {
                return res.status(404).json({ message: 'Data not found' });
            }
            res.status(200).json({ message: 'Data fetched successfully', data });
        })
        .catch((err) => {
            res.status(500).json({ message: 'Error fetching data', error: err });
        });
});

app.post("/api/category/create", (req, res) => {
    const name = req.body["name"];

    if (!name) {
        res.status(400).json({
            message: "name is required"
        });
    }

    const newCategory = new Category({ name });
    newCategory.save().
        then((category) => {
            res.status(201).json({ message: "Category created successfully", data: category });
        }
        ).catch((err) => {
            res.status(500).json({ message: 'Error saving data', error: err });
        });
});



app.post("/api/sub-category/create", async (req, res) => {
    const { name, category_id } = req.body;

    if (!name || !category_id) {
        return res.status(400).json({ message: "Name and category_id are required." });
    }

    try {
        // Validate if the category exists
        const categoryExists = await Category.findById(category_id);
        if (!categoryExists) {
            return res.status(404).json({ message: "Category not found." });
        }

        // Create and save the subcategory
        const newSubCategory = new SubCategory({ name, category: category_id });
        const savedSubCategory = await newSubCategory.save();

        res.status(201).json({
            message: "SubCategory created successfully",
            data: savedSubCategory,
        });
    } catch (err) {
        res.status(500).json({ message: "Error saving subcategory", error: err.message });
    }
});


app.get('/api/all-categories', async (req, res) => {
    try {
        // Fetch all categories
        const categories = await Category.find();

        // Fetch all subcategories
        const subcategories = await SubCategory.find();

        // console.log(subcategories);

        // Group subcategories by their categories
        const groupedData = categories.map((category) => {
            return {
                category: {
                    id: category._id,
                    name: category.name,
                },
                subcategories: subcategories
                    .filter((sub) => sub.category._id.toString() === category._id.toString())
                    .map((sub) => ({
                        id: sub._id,
                        name: sub.name,
                    })),
            };
        });

        res.status(200).json({
            message: 'Categories and subcategories fetched successfully',
            data: groupedData,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error });
    }
});

// POST route to create a new user
app.post('/api/user/create', async (req, res) => {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if the email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Create a new user instance
        const newUser = new User({
            username,
            email,
            password
        });

        // Save the user to the database
        const savedUser = await newUser.save();

        // Respond with the created user data
        res.status(201).json({
            message: 'User created successfully',
            user: {
                username: savedUser.username,
                email: savedUser.email
            }
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// POST route for user login
app.post('/api/user/login', async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare the password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create a JWT token
        const payload = {
            userId: user._id,
            username: user.username,
            email: user.email
        };

        const token = jwt.sign(payload, 'your_jwt_secret', { expiresIn: '1h' });

        // Send back the token
        res.status(200).json({
            message: 'Login successful',
            token
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Access denied, no token provided' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
};

// Example of a protected route
app.get('/api/protected', authenticate, (req, res) => {
    res.status(200).json({ message: 'Protected data', user: req.user });
});





app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
