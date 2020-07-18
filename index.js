'use strict';
const line = require('@line/bot-sdk');
const express = require('express');
const config = require('./config.json');
const client = new line.Client(config);
const axios = require('axios');

const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }

  Promise.all(req.body.events.map(event => {
      return handleEvent(event);
    }))
    .then(() => res.end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});



var handleEvent = (event) => {
  const message = event.message.text;
  const replyToken = event.replyToken;
  let msg = message.split(" ");
  if(msg[0].toUpperCase() == 'all'.toUpperCase()){
    if(msg.length == 2){
      handleAll(msg[1].toUpperCase(),replyToken);
    }else{
      handleAll(null,replyToken);
    }
  }else if(msg[0]*0 == 0){
      if(msg.length == 3){
        let data = {
          'amount' : msg[0],
          'cur1' : msg[1].toUpperCase(),
          'cur2' : msg[2].toUpperCase(),
        };
        handleBetween(data,replyToken);
      }
  }else{
    return;
  }
}

var handleBetween = (data,replyToken) => {
  let base = data.cur1;
  let method1 = data.cur1;
  let method2 = data.cur2;
  axios.get(`https://api.exchangeratesapi.io/latest?base=${base}`)
    .then(function (response) {
      let cur2 = response.data.rates[method2];
      let total = cur2*data.amount;
      if(total*0 != 0){
        return;
      }
      let message = `${data.amount} ${method1} = ${parseFloat(total).toFixed(3)} ${method2}`;
      const replyMessage = {
        type: 'text',
        text: message
      };
      replyText(replyToken, replyMessage);
    })
    .catch(function (error) {
      console.log(`error : ${error}`);
    })
}

var handleAll = (message,replyToken) => {
  let url = `latest?base=USD`;
  let base = 'usd';
  if(message){
    url = `latest?base=${message}`;
    base = message;
  }
  axios.get(`https://api.exchangeratesapi.io/${url}`)
    .then(function (response) {
      let rawCurrency = JSON.stringify(response.data.rates);
      rawCurrency = rawCurrency.replace(/{/g, "");
      rawCurrency = rawCurrency.replace(/}/g, "");
      rawCurrency = rawCurrency.replace(/"/g, "");
      rawCurrency = rawCurrency.replace(/,/g, "\n");
      rawCurrency = rawCurrency.replace(/:/g, " = ");
      let currency = `Base in 1 ${base} => ${rawCurrency}\n`;
      const replyMessage = {
        type: 'text',
        text: currency
      };
      replyText(replyToken, replyMessage);
    })
    .catch(function (error) {
      console.log('error');
    })
}


const replyText = (token, message) => {
  client.replyMessage(token, message)
    .then(() => {
      console.log('success');
    })
    .catch((err) => {
      console.log(err);
    });
};

const port = 3000;
app.listen(process.env.PORT || port, () => {
  console.log(`listening on ${port}`);
});