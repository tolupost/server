// const express = require ('express');
// var bodyParser = require('body-parser');
// var cors = require('cors');
// var helmet = require('helmet');


// const mongoose = require("mongoose");
// require('dotenv').config();
// const otpGenerator = require("otp-generator");
// const deliveryRouter = require("./routes/delivery");

// const PORT = 3000;


// const app = express();

// // IMPORTS FROM OTHER FILES
// const authRouter = require("./routes/auth");
// const userRouter = require("./routes/user");
// const adminRouter = require("./routes/admin");
// // middleware
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cors());
// app.use(helmet());
// app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
// app.use(express.json());
// app.use(authRouter);
// app.use(deliveryRouter);
// app.use(userRouter);
// app.use(adminRouter);
// // Connections
// mongoose
//   .set('strictQuery', false)
//   .connect(DB)
//   .then(() => {
//     console.log("Connection Successful");
//   })
//   .catch((e) => {
   
//   });

// app.listen(PORT,"0.0.0.0", () => {
//      console.log(`connected at port ${PORT}`  );
// })

const express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();
const otpGenerator = require('otp-generator');
const deliveryRouter = require('./routes/delivery');
var paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
var uuid = require('node-uuid');

const PORT = 3000;
// const DB = 'mongodb+srv://richard:liverpool@cluster0.vxcma1z.mongodb.net/?retryWrites=true&w=majority';
 const DB = "mongodb+srv://tolulong45:liverpool@cluster0.ucfkvuy.mongodb.net/?retryWrites=true&w=majority";
const app = express();

// IMPORTS FROM OTHER FILES
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(express.json());
app.use(authRouter);
app.use(deliveryRouter);
app.use(userRouter);
app.use(adminRouter);

// Connections
mongoose
  .set('strictQuery', false)
  .connect(DB)
  .then(() => {
    console.log('Connection Successful');
  })
  .catch((e) => {
    console.error('Connection Failed: ', e);
  });

// paystack module is required to make charge token call
// uuid module is required to create a random reference number
// Set up the necessary routes
app.set('port', process.env.PORT || 5000);
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get('/', function (req, res) {
  res.send(
    '<body><head><link href="favicon.ico" rel="shortcut icon" /></head><body><h1>Awesome!</h1><p>Your server is set up. Go ahead and configure your Paystack sample apps to make calls to: <ul><li> <a href="#">https://' +
      req.headers.host +
      '</a></li></ul> </p></body></html>'
  );
});

app.get('/new-access-code', function (req, res) {
  var customerid = req.params.customerid;
  var cartid = req.params.cartid;
  // You can then look up customer and cart details in a db, etc.
  // I'm hardcoding an email here for simplicity
  var amountinkobo = process.env.TEST_AMOUNT * 100;
  if (isNaN(amountinkobo) || amountinkobo < 2500) {
    amountinkobo = 2500;
  }
  var email = process.env.SAMPLE_EMAIL;

  // All fields supported by this call can be gleaned from
  // https://developers.paystack.co/reference#initialize-a-transaction
  paystack.transaction.initialize(
    {
      email: email, // a valid email address
      amount: amountinkobo, // only kobo and must be an integer
      metadata: {
        custom_fields: [
          {
            display_name: 'Started From',
            variable_name: 'started_from',
            value: 'sample charge card backend',
          },
          {
            display_name: 'Requested by',
            variable_name: 'requested_by',
            value: req.headers['user-agent'],
          },
          {
            display_name: 'Server',
            variable_name: 'server',
            value: req.headers.host,
          },
        ],
      },
    },
    function (error, body) {
      if (error) {
        res.send({ error: error });
        return;
      }
      res.send(body.data.access_code);
    }
  );
});

app.get('/verify/:reference', function (req, res) {
  var reference = req.params.reference;

  paystack.transaction.verify(reference, function (error, body) {
    if (error) {
      res.send({ error: error });
      return;
    }
    if (body.data.success) {
      // save authorization
      var auth = body.authorization;
    }
    res.send(body.data.gateway_response);
  });
});

// The 404 Route (ALWAYS Keep this as the last route)
app.get('/*', function (req, res) {
  res.status(404).send('Only GET /new-access-code or GET /verify/{reference} is allowed');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`connected at port ${PORT}`);
});


