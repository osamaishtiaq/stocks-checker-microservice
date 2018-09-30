/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const axios = require('axios');

const CONNECTION_STRING = process.env.DB;

const stockSchema = new Schema({
  stock : {type: String, uppercase: true, required: true},
  likes : [{type: String}]
});

const Stock = mongoose.model('Stock', stockSchema);

module.exports = function (app) {
  
  mongoose.connect(CONNECTION_STRING);
  const db = mongoose.connection;
  
  db.on('error', () => { console.log('Cannot connect to database'); });
  
  db.once('open', () => {
    console.log('successfully connected to database');
    app.route('/api/stock-prices')
      .get(handleStockPricesGET);
    //404 Not Found Middleware
    app.use(function(req, res, next) {
      res.status(404)
        .type('text')
        .send('Not Found');
    }); 
  });
  
};

const buildRequest = (stock) => {
  return `https://www.alphavantage.co/query?symbol=${stock}&apikey=${process.env.STOCK_API_KEY}&function=GLOBAL_QUOTE`;
}

function handleStockPricesGET(req, res) {
  const clientIps = req.header('x-forwarded-for') || req.connection.remoteAddress;
  const clientIp = clientIps.split(',')[0];
  console.log("request coming from ");
  console.log(clientIp);
  
  if (!("stock" in req.query && req.query.stock !== '')) {
      return res.send('query for a stock dammit!');
  }
  const stocks = req.query.stock.toString().split(',');
  
  // For one stock
  if (stocks.length === 1) {
    axios.get(buildRequest(stocks[0]))
      .then(response => {
      // Check if response if empty
      if (!Object.keys(response.data['Global Quote']).length) {
        return res.json({"stockData": [], notFound: true});
      }
      const stockData = {"stock": response.data['Global Quote']['01. symbol'], 
                            "price": response.data['Global Quote']['05. price']};
      // Find this stock in db
      Stock.findOne({stock: stockData.stock}, (err, doc) => {
        if (err) {
          return res.json({"ERROR": err});
        }
        // if nothing is found, create new stock
        const stockDoc = (!doc) ? new Stock({"stock": stockData.stock, "likes": []}) : doc;
        // if like is passed and there are no likes by this ip then register a like
        if ("like" in req.query && req.query.like.toLowerCase() === "true" && stockDoc.likes.every(ip => ip !== clientIp)) {
          stockDoc.likes.push(clientIp);
        }
        // save and return response
        stockDoc.save((err, savedDoc) => {
          if (err) {
            return res.json(err);
          }
          // RESULT RESPONSE
          return res.json({"stockData": {"stock": savedDoc.stock, "price": stockData.price, "likes": savedDoc.likes.length}});  
        });
      });
    })
      .catch(err => {
      return res.send('Error Occured');
    });
  } 
  else if (stocks.length === 2) {
    // For Two stocks
    axios.all([
      axios.get(buildRequest(stocks[0])),
      axios.get(buildRequest(stocks[1]))
    ])
      .then(axios.spread((firstResp, secondResp) => {
      if (!Object.keys(firstResp.data['Global Quote']).length || !Object.keys(firstResp.data['Global Quote']).length ) {
        return res.json({"stockData": [], notFound: true});
      }
      const stockData = [
        {
          "stock": firstResp.data['Global Quote']['01. symbol'], 
          "price": firstResp.data['Global Quote']['05. price']
        },
        {
          "stock": secondResp.data['Global Quote']['01. symbol'], 
          "price": secondResp.data['Global Quote']['05. price']
        }
      ];
      Stock.findOne({"stock": stockData[0].stock})
      .exec((err, firstStock) => {
        if (err) {
          return res.json({"ERROR": err});
        }
        const firstStockDoc = (!firstStock) ? new Stock({"stock" : stockData[0].stock, "likes": []}) : firstStock;
        // if like is passed and there are no likes by this ip then register a like
        if ("like" in req.query && req.query.like.toLowerCase() === "true" && firstStockDoc.likes.every(ip => ip !== clientIp)) {
          firstStockDoc.likes.push(clientIp);
        }
        firstStockDoc.save((err, savedFirstDoc) => {
          if (err) {
            return res.json(err);
          }
          Stock.findOne({"stock": stockData[1].stock})
          .exec((err, secondStock) => {
            if (err) {
              return res.json({"ERROR": err});
            }
            const secondStockDoc = (!secondStock) ? new Stock({"stock": stockData[1].stock, "likes": []}) : secondStock;
            // if like is passed and there are no likes by this ip then register a like
            if ("like" in req.query && req.query.like.toLowerCase() === "true" && secondStockDoc.likes.every(ip => ip !== clientIp)) {
              secondStockDoc.likes.push(clientIp);
            }
            secondStockDoc.save((err, savedSecondDoc) => {
              if (err) {
                return res.json(err);
              }
              const finalResponse = {
                "stockData": [
                  {
                    "stock" : savedFirstDoc.stock, 
                    "price": stockData[0].price, 
                    "rel_likes": (savedFirstDoc.likes.length-savedSecondDoc.likes.length)
                  },
                  {
                    "stock": savedSecondDoc.stock,
                    "price": stockData[1].price,
                    "rel_likes": (savedSecondDoc.likes.length-savedFirstDoc.likes.length)
                  }     
                ]
              }
              return res.json(finalResponse);
            });
          });
        });
      });
    }))
      .catch(err => {
      return res.send('Error Occured');
    });
  } 
  else {
    return res.send('too many stock queries');
  }
};