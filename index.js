const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin');
require('dotenv').config();

const port = 5000

const app = express();
app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require("./configs/burj-al-arab-29d2a-firebase-adminsdk-xd0fa-a976a38525.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bm8ip.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/', (req, res) => {
    res.send('Hello World!')
})

client.connect(err => {
    const bookingsCollection = client.db("burjAlArab").collection("bookings");

    app.post("/addBooking", (req, res) => {
        const newBooking = req.body;
        bookingsCollection.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.get("/bookings", (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith("Bearer ")) {
            const idToken = bearer.split(" ")[1];
            admin.auth().verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail == queryEmail) {
                        bookingsCollection.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.send(documents);
                            })
                    }
                    else{
                        res.status(401).send("Unauthorized access");
                    }
                })
                .catch((error) => {
                    res.status(401).send("Unauthorized access");
                });
        }
        else{
            res.status(401).send("Unauthorized access");
        }
    })

});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})