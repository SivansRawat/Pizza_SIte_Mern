const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const stripe = require("stripe")("sk_test_51QNJLxJ7MmDUvRUvnxEsEBb8ZChFENVKU6yXdhJCawBjA065M83iDEwhsTw3WhJJw6QU281UeNmd0U7ZmNCOhuD400JuaDbH9J")
const Order = require('../models/orderModel')
router.post("/placeorder", async(req, res) => {
  
  const {token , subtotal , currentUser , cartItems} = req.body

  try {
      const customer = await stripe.customers.create({
          email : token.email,
          source:token.id
      })

      const payment = await stripe.paymentIntents.create({
          amount:subtotal*100,
          currency:'inr',
          customer : customer.id,
          receipt_email : token.email
      }, {
          idempotencyKey : uuidv4()
      })

      if(payment)
      {
         
          const neworder = new Order({
              name : currentUser.name,
              email : currentUser.email ,
              userid : currentUser._id ,
              orderItems : cartItems , 
              orderAmount : subtotal,
              shippingAddress : {
                  street : token.card.address_line1,
                  city : token.card.address_city,
                  country : token.card.address_country,
                  pincode : token.card.address_zip
              },
              transactionId : payment.source.id
          })
          
          neworder.save()

          res.send('Order placed successfully')
      }
      else{
          res.send('Payment failed')
      }

  } catch (error) {
      return res.status(400).json({ message: 'Something went wrong' + error});
  }

});


router.post("/getuserorders", async(req, res) => {
  const {userid} = req.body
  try {
      const orders = await Order.find({userid : userid}).sort({_id : -1})
      res.send(orders)
  } catch (error) {
      return res.status(400).json({ message: 'Something went wrong' });
  }
});

router.get("/getallorders", async(req, res) => {

     try {
         const orders = await Order.find({})
         res.send(orders)
     } catch (error) {
         return res.status(400).json({ message: error});
     }

});

router.post("/deliverorder", async(req, res) => {

    const orderid = req.body.orderid
    try {
        const order = await Order.findOne({_id : orderid})
        order.isDelivered = true
        await order.save()
        res.send('Order Delivered Successfully')
    } catch (error) {

        return res.status(400).json({ message: error});
        
    }
  
});



module.exports = router





// const express = require("express");
// const router = express.Router();
// const { v4: uuidv4 } = require('uuid');
// const stripe = require("stripe")("sk_test_51QNJLxJ7MmDUvRUvnxEsEBb8ZChFENVKU6yXdhJCawBjA065M83iDEwhsTw3WhJJw6QU281UeNmd0U7ZmNCOhuD400JuaDbH9J");
// const Order = require('../models/orderModel');

// router.post("/placeorder", async (req, res) => {
//   const { token, subtotal, currentUser, cartItems } = req.body;

//   try {
//     // Create a customer in Stripe
//     const customer = await stripe.customers.create({
//       email: token.email,
//       source: token.id,
//     });

//     // Create a PaymentIntent
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(subtotal * 100), // Amount in smallest currency unit
//       currency: 'inr',
//       customer: customer.id,
//       receipt_email: token.email,
//       payment_method: token.id,
//       confirm: true, // Confirm the payment immediately
//     }, {
//       idempotencyKey: uuidv4(),
//     });

//     if (paymentIntent.status === 'succeeded') {
//       // Create a new order in the database
//       const neworder = new Order({
//         name: currentUser.name,
//         email: currentUser.email,
//         userid: currentUser._id,
//         orderItems: cartItems,
//         orderAmount: subtotal,
//         shippingAddress: {
//           street: token.card.address_line1,
//           city: token.card.address_city,
//           country: token.card.address_country,
//           pincode: token.card.address_zip,
//         },
//         transactionId: paymentIntent.id,
//       });

//       await neworder.save();
//       res.send('Order placed successfully');
//     } else {
//       res.status(400).send('Payment failed');
//     }
//   } catch (error) {
//     return res.status(400).json({ message: 'Something went wrong: ' + error.message });
//   }
// });

// router.post("/getuserorders", async (req, res) => {
//   const { userid } = req.body;
//   try {
//     const orders = await Order.find({ userid: userid }).sort({ _id: -1 });
//     res.send(orders);
//   } catch (error) {
//     return res.status(400).json({ message: 'Something went wrong' });
//   }
// });

// router.get("/getallorders", async (req, res) => {
//   try {
//     const orders = await Order.find({});
//     res.send(orders);
//   } catch (error) {
//     return res.status(400).json({ message: error });
//   }
// });

// router.post("/deliverorder", async (req, res) => {
//   const { orderid } = req.body;
//   try {
//     const order = await Order.findOne({ _id: orderid });
//     order.isDelivered = true;
//     await order.save();
//     res.send('Order Delivered Successfully');
//   } catch (error) {
//     return res.status(400).json({ message: error });
//   }
// });

// module.exports = router;