const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieparser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


// Midelware
app.use(cors({
  origin: ['http://localhost:5173' , 'http://localhost:5174'],
  credentials: true
}));

app.use(express.json());
app.use(cookieparser());

const VeryfiedToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token){
    return res.status(401).send({ message: 'Unauthorize access' });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(403).send({ message: 'Invalid token' });
    }
    req.user = decoded;
    next();
  })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hflxk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const ServicesCollection = client.db('CarServicesDB').collection('Services');
    const BookingsCollection = client.db('CarServicesDB').collection('Bookings');
    

    // Auth Related api methods
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h',
      })
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
      })
      res.send(token);
    })

    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logout user',user);
      res.clearCookie('token', {maxAge: 0}).send({success: true});
    })

    //services related api methods
    app.get("/services", async (req, res) => {
      const services = await ServicesCollection.find().toArray();
      res.json(services);
    })

    app.get("/services/:id", async (req, res) => {
      const qury = {_id: new ObjectId(req.params.id)};
      const service = await ServicesCollection.findOne(qury);
      res.send(service);
    })
    
    app.post("/services", async (req, res) => {
      const newService = req.body;
      const result = await ServicesCollection.insertOne(newService);
      res.send(result);
    })



    //bookings related api methods
    app.get("/bookings", VeryfiedToken, async (req, res) => {
      const booking = await BookingsCollection.find().toArray();
      res.send(booking);
    })

    app.get("/bookings/:email",VeryfiedToken, async (req, res) => {
      // console.log(req.params.email);
      if(req.params.email !== req.user.email) {
        return res.status(401).send({ message: 'Unauthorize access' });
      }
      const qury = {email: req.params.email};
      const booking = await BookingsCollection.find(qury).toArray();
      res.send(booking);
    })

    app.get("/bookings/:id", VeryfiedToken, async (req, res) => {
      const qury = {_id: new ObjectId(req.params.id)};
      const booking = await BookingsCollection.findOne(qury);
      res.send(booking);
    })

    app.post("/bookings", async (req, res) => {
      const newBooking = req.body;
      const result = await BookingsCollection.insertOne(newBooking);
      res.send(result);
    })


    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const qury = {_id: new ObjectId(id)};
      const booking = req.body;
      const UpdatedBookings = {
        $set:{
          status: booking.status
        },
      };
      const result = await BookingsCollection.updateOne(qury, UpdatedBookings);
      res.send(result);
    })



    app.delete("/bookings/:id", async (req, res) => {
      const qury = {_id: new ObjectId(req.params.id)};
      const result = await BookingsCollection.deleteOne(qury);
      res.send(result);
    })



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get("/", (req, res) => {
    res.send("Car Servicing server is Running!");
})


app.listen(port, ()=>{
    console.log(`Car Servicing server Running port ${port}`);
})