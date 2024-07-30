const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');  // Import the cors package

const app = express();
const port = 3000;

const { ObjectId } = require('mongodb'); // Convert String to Mongo ObjectID
// MongoDB connection URI
const uri = 'mongodb+srv://gpyasinduramith:arNdzs4Xpj7EWMmv@cluster0.8moakri.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Replace with your MongoDB URI if different

// Database and collection names
const dbName = 'Products';
const collectionName = 'Description';
const details = 'Details'

// Auth Users database and collection in Mongo
const dbUsers = 'Users'
const dbUsersCollection = 'Customers'

let db;

// CORS
const corsOptions = {
    origin: 'http://localhost:4200',  // Allow Angular server to request APIs
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
MongoClient.connect(uri)
    .then(client => {
        db = client.db(dbName);
        dbu = client.db(dbUsers);
        console.log(`Connected to database: ${dbName}`);
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });



// Define a route to login
app.post('/login', async (req, res) => {
    try {
        const User = dbu.collection(dbUsersCollection);
        const { email, password } = req.body;
        const user = await User.findOne({ "email": email})
       if (!user || user.password !== password) {
        return res.status(400).json({ error: 'Invalid username or password' });
      }
      else{
        const { password: userPassword, ...userWithoutPassword } = user; // seperate 
        res.json(userWithoutPassword);
      }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register Route
app.post('/register', async (req, res) => {
    try {
        const User = dbu.collection(dbUsersCollection);
        const { username,email, password } = req.body;
        const user = await User.insertOne({ "username":username,"email":email, "password":password });
        return res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});







// Define a route to get all data from the collection
app.get('/products', async (req, res) => {
    try {
        const collection = db.collection(collectionName);
        const data = await collection.find({}).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Get specific
app.get('/products/:id', async (req, res) => {
    try {
        const collection = db.collection(details);
        const productId = req.params.id;
        
        // Validate the ObjectId
        //if (!ObjectId.isValid(productId)) {
       ///     return res.status(400).send('Invalid ID format');
        //}

        const data = await collection.findOne({ "ref_id": productId });

        if (!data) {
            return res.status(404).send('Product not found');
        }

        res.json(data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});






app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});