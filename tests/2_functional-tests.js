/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({"stock": "Goog"})
          .end(function(err, res){
          assert.equal(res.status, 200, 'response is OK');
          assert.property(res.body.stockData, "stock", 'has stock property');
          assert.property(res.body.stockData, "price", 'has price property');
          assert.property(res.body.stockData, "likes", 'has likes property');
          done();
        });
      });
      
      test('1 stock with like', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({"stock": "msft", like: true})
          .end(function(err, res){
          assert.equal(res.status, 200, 'response is OK');
          done();
          });
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done){
        chai.request(server)
          .get('/api/stock-prices')
          .query({"stock": "msft", like: true})
          .end(function(err, res){
          assert.equal(res.status, 200, 'response is OK');
          let like = res.body.stockData.likes;
          chai.request(server)
          .get('/api/stock-prices')
          .query({"stock": "msft", like: true})
          .end(function(err, res){
            assert.equal(res.status, 200, 'response is OK');
            assert.equal(res.body.stockData.likes, like, 'Like function is good');
            done();
          });
        });
      });
      
      test('2 stocks', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({"stock": ['Goog','Msft']})
          .end(function(err, res){
          console.log(res.body);
          assert.equal(res.status, 200, 'response is OK');
          assert.isArray(res.body.stockData, 'stock Data is array');
          assert.equal(res.body.stockData.length, 2, 'Stock data is proper length');
          done();
        });
      });
      
      test('2 stocks with like', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({"stock": ['Goog','Msft']})
          .end(function(err, res){
          console.log(res.body);
          assert.equal(res.status, 200, 'response is OK');
          assert.property(res.body.stockData[0], "rel_likes", 'has rel_likes property');
          assert.property(res.body.stockData[1], "rel_likes", 'has rel_likes property');
          assert.equal(res.body.stockData.length, 2, 'Stock data is proper length');
          done();
        });
      });
      
    });

});
