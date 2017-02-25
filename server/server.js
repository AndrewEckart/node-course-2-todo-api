var express = require('express');
var bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const fs = require('fs');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');

var app = express();

app.use(bodyParser.json());

// app.use((req, res, next) => {
//   var now = new Date().toString();
//   var log = `${now}: ${req.method} ${req.url}`;
//
//   console.log(log);
//   fs.appendFile('./server/logs/server.log', log + '\n', (err) => {
//     if (err) {
//       console.log('Unable to append to server.log');
//     }
//   });
//   next();
// });

app.post('/todos', (req, res) => {
  var todo = new Todo({
    text: req.body.text
  });

  todo.save().then((doc) => {
    res.status(200).send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/todos', (req, res) => {
  Todo.find().then((todos) => {
    res.status(200).send({todos});
  }, (e) => {
    res.status(500).send(e);
  });
});

app.get('/todos/:id', (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findById(id).then((todo) => {
    if (!todo) {
      return res.status(404).send();
    }
    res.send({todo});
  }).catch((e) => res.status(400).send());

});

app.listen(3000, () => {
  console.log(`Started on port 3000`);
});

module.exports = {app};
