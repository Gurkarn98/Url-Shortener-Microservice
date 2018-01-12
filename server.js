var express = require('express');
var app = express();
var validUrl = require('valid-url');
var mongodb = require('mongodb').MongoClient;
var module = require("./encode.js")
var count = 1000;
app.use(express.static('public'));

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/url/*", function (req, res) {
  if (validUrl.isUri(req.params[0])){
    var shortened = undefined;
    mongodb.connect(process.env.MONGODB, function (err, client){
      if (err) {console.log(err)}
      var db = client.db("short-urls")
      var collection = db.collection("shortened-urls")
      collection.find({url: req.params[0]}).toArray(function(err, data){
        if (err) throw err
        if (data.length>0){
          shortened = data[0].shortened
          res.json(
            {
              Orginal : data[0].url,
              Shortened : shortened,
            }
          )
        } else {
          collection.insert({url: req.params[0], shortened: "", _id: count++})          
          collection.find({url: req.params[0]}).toArray(function(err, data){
            if (err) throw err
            shortened = "https://usms.glitch.me/"+module(data[0]._id)
            collection.update({url : req.params[0]}, {url : req.params[0], shortened : shortened})
            res.json(
              {
                Orginal : req.params[0],
                Shortened : shortened,
              }
            )
          })
        }
      })
    })
  } else {
    res.json(
      {
        ERROR : "Not a valid URL!!!",
        HELP : "Please visit the homepage for more information about the format.",
        HOME_PAGE : "https://usms.glitch.me/"
      }
    );
  }
});
app.get("/*", function (req, res) {
  if (req.params[0] == "client.js" || req.url == "/favicon.ico"){
    res.send("")
  } else {
    mongodb.connect(process.env.MONGODB, function (err, client){
      if (err) {console.log(err)}
        var db = client.db("short-urls")
        var collection = db.collection("shortened-urls")
        console.log("https://usms.glitch.me"+req.url)
        collection.find({shortened: "https://usms.glitch.me"+req.url}).toArray(function(err, data){
          if (err) throw err
          console.log(data)
          if(data.length > 0){
            res.redirect(data[0].url)
          } else {
            res.json({ERROR: "Please enter a valid url or create new short url.",
                      HELP : "Please visit the homepage for more information about how to create short url.",
                      HOME_PAGE : "https://urlshortenerms-gurkarn98.glitch.me/" })
          }
        })
    })
  }
})
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

