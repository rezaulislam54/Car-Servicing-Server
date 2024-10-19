const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


// Midelware
app.use(cors());
app.use(express.json());


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
    

    //services
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



    //bookings
    app.get("/bookings", async (req, res) => {
      const booking = await BookingsCollection.find().toArray();
      res.send(booking);
    })

    app.get("/bookings/:email", async (req, res) => {
      const qury = {email: req.params.email};
      const booking = await BookingsCollection.find(qury).toArray();
      res.send(booking);
    })

    app.post("/bookings", async (req, res) => {
      const newBooking = req.body;
      const result = await BookingsCollection.insertOne(newBooking);
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