const express = require('express')
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

 const app = express()
const port = process.env.PORT || 5000; 

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mrm2x86.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const serviceCollection = client
      .db("doctors-portal")
      .collection("services");
    const bookingCollection = client
      .db("doctors-portal")
      .collection("bookings");

    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });




    app.get('/available', async (req, res) => {
      const date = req.query.date || "Oct 28, 2022";

      // get all service

      const services = await serviceCollection.find().toArray();

     

      // for each service, find booking that service

      services.forEach(service => {
        const serviceBooking = bookings.filter(book => book.treatment === service.name);
        const bookedSlots = serviceBooking.map(book => book.slot);
        const available = service.slots.filter(slot => !bookedSlots.includes(slot));
        service.slot = available;
      })

      services.forEach(service => {
        const serviceBookings = bookings.filter(b => b.treatment === service.name);
        const booked = serviceBookings.map(s => s.slot);
        const available = service.slots.filter(s => !booked.includes(s));
        service.available = available;
      })

      res.send(services);
    })


  

    // api naming convention


  
    app.get("/booking", async (req, res) => {
      const patient = req.query.patient;
      const query = { patient: patient };
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
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