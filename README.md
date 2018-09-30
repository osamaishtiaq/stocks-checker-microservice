**FreeCodeCamp**- Information Security and Quality Assurance
------

# Project Stock Price Checker

## [Preview](https://stocks-checker-ozarion.glitch.me/)

### API ENDPOINT: `https://stocks-checker-ozarion.glitch.me/`

### Example usage:
```
/api/stock-prices?stock=goog

/api/stock-prices?stock=goog&like=true

/api/stock-prices?stock=goog&stock=msft

/api/stock-prices?stock=goog&stock=msft&like=true
```

### Example return:
```
{"stockData":{"stock":"GOOG","price":"786.90","likes":1}}

{"stockData":[{"stock":"MSFT","price":"62.30","rel_likes":-1},{"stock":"GOOG","price":"786.90","rel_likes":1}]}
```