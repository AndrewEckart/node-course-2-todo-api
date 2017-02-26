const {ObjectID} = require('mongodb');

const {mongoose} = require('./../server/db/mongoose');
const {Todo} = require('./../server/models/todo');
const {User} = require('./../server/models/user');

// Todo.remove({}).then((result) => {
//   console.log(result);
// });

// Todo.findOneAndRemove({}).then((result) => {
//   console.log(result);
// });

Todo.findByIdAndRemove("58b23f9dfc4e66d6ea0d00e2").then((todo) => {
  console.log(todo);
});
