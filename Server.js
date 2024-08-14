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
        const { password: userPassword, ...userWithoutPassword } = user; // password will not be passed to front end
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
        const currentuser = await User.findOne({ "email": email }); // Find If the email has been already used
        if (!currentuser){ // Create record only if the email
            const user = await User.insertOne({ "username":username,"email":email, "password":password,"cart":[] });
            res.json(user);
        }
        else{
            // Email already exists error (HTTP 409 Conflict)
            res.status(409).json({ error: 'User email has been already used' })
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});


// Define a route to get all products
app.get('/products', async (req, res) => {   
    try {
        const collection = db.collection(collectionName);
        const data = await collection.find({}).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Get specific product Id through product menu
app.get('/products/:id', async (req, res) => {
    try {
        const collection = db.collection(details);
        const productId = req.params.id;
        const { username,email, password } = req.body
        const data = await collection.findOne({ "ref_id": productId });

        if (!data) {
            return res.status(404).send('Product not found');
        }

        res.json(data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Get specific product detail througt providing ID in product>Details (used in cart)
app.post('/products/detail_request', async (req, res) => {
    try {
        const collection = db.collection(details);
        const { productId } = req.body
        const objectId = new ObjectId(productId);
        const data = await collection.findOne({ "_id": objectId });
        if (!data) {
            return res.status(404).send('Product not found');
        }
        res.json(data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post('/user/update_cart',async(req,res)=>{
    try {
        // Find the document and update a specific object in the array
        const User = dbu.collection(dbUsersCollection);
        const { email,objectId,quantity } = req.body; // user email object id and new count that has to appear on cart
        const objectId_ = new ObjectId(objectId);// CONVERT IDstring to IDmongodb class

        if(quantity<0){
            res.json("Cart Error: Number of items can't be negative")
        }
        else if (quantity==0){ // REMOVE A CART ELEMENT FROM THE USER DOC
            const result = await User.updateOne(
                { "email": email},  // search user 
                { $pull: { cart: { objectId: objectId_} } } // search cart item and pull the item out
            );
            res.json(result);
        }
        else if( quantity>0){
            const result = await User.updateOne(
                { "email": email, "cart.objectId": objectId_},  // search user and cart object to change
                {$set: {"cart.$.count": quantity }}
            );// Update the count of the matched object
            res.json(result);
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }

})

app.post('/user/add_to_cart',async(req,res)=>{
    const User = dbu.collection(dbUsersCollection);
    const { email,objectId} = req.body; // user email object id and new count that has to appear on cart
    const objectId_ = new ObjectId(objectId);// CONVERT IDstring to IDmongodb class
    const result = await User.updateOne(
        { "email": email,"cart.objectId":{ $ne:objectId_}},  // search user and check whether the item cart object to change
        {$addToSet: {cart:{ // addtoset => avoid duplications
        "objectId": objectId_,
        "count": 1 
        }}}
    );// Add to cart if the item not in the count of the matched object
    res.json(result)
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});