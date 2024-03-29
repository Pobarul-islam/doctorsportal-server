const express = require('express')
const cors = require('cors');
const jwt = require("jsonwebtoken");
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

 const app = express()
const port = process.env.PORT || 5000; 

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mrm2x86.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
   
    if (err) {
      return res.status(403).send({message: 'Forbidden access'})
    }
   
    req.decoded = decoded;
    next();
 });
}

async function run() {
  try {
    await client.connect();
    const serviceCollection = client
      .db("doctors-portal")
      .collection("services");
    const bookingCollection = client
      .db("doctors-portal")
      .collection("bookings");
    const usersCollection = client
      .db("doctors-portal")
      .collection("users");

    
 
    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

   app.get("/user", verifyJWT, async (req, res) => {
     const users = await usersCollection.find().toArray();
     res.send(users);
   });
    
     app.get("/admin/:email", async (req, res) => {
       const email = req.params.email;
       const user = await userCollection.findOne({ email: email });
       const isAdmin = user.role === "admin";
       res.send({ admin: isAdmin });
     });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );

      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      res.send({ result, accessToken: token });
    });



    app.get('/available', async (req, res) => {
      const date = req.query.date || "Oct 28, 2022";

      // get all service

      const services = await serviceCollection.find().toArray();

     
      // get the booking of that day

      const query = { date: date };
      const bookings = await bookingCollection.find(query).toArray();

      // for each service, find booking that service

  

      services.forEach(service => {
        const serviceBookings = bookings.filter(b => b.treatment === service.name);
        const booked = serviceBookings.map(s => s.slot);
        const available = service.slots.filter(s => !booked.includes(s));
        service.available = available;
      })

      res.send(services);
    })


  

    // api naming convention


  
    app.get("/booking", verifyJWT, async (req, res) => {
      const patient = req.query.patient;
      const decodedEmail = req.decoded.email;
      if (patient === decodedEmail) {
        const query = { patient: patient };
        const bookings = await bookingCollection.find(query).toArray();
        return res.send(bookings);
      }
      else {
        return res.status(403).send({ message: 'Forbidden access' });
      }
    });



    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({success: false, booking: exists})
      }
      

      const result = await bookingCollection.insertOne(booking);
      return res.send({success: true, result});
    })


  }
  
  finally {
    
  }

}

run().catch(console.log.dir); 

app.get('/', (req, res) => {
  res.send('Doctors Portal')
})

app.listen(port, () => {
  console.log(`Doctors app listening on port ${port}`)
})

