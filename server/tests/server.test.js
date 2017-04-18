const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {

  it('should create a new todo', (done) => {
    var text = 'New test todo';
    request(app)
      .post('/todos')
      .send({text})
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({text}).then((todos) => {
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should not create todo with invalid body data', (done) => {
    request(app)
      .post('/todos')
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body.name).toBeA('string').toBe('ValidationError');
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        Todo.find().then((todos) => {
          expect(todos.length).toBe(2);
          done();
        }).catch((e) => done(e));
      });
  });

});

describe('GET /todos', () => {

  it('should get all todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });

});

describe('GET /todos/:id', () => {

  it('should return todo doc', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it('should return 404 if todo not found', (done) => {
    var invalidId = '507f1f77bcf86cd799439011';
    request(app)
      .get(`/todos/${invalidId}`)
      .expect(404)
      .end(done);
  });

  it('should return 404 if object id is invalid', (done) => {
    request(app)
      .get(`/todos/123`)
      .expect(404)
      .end(done);
  });

});

describe('DELETE /todos/:id', () => {

  it('should remove a todo', (done) => {
    var hexId = todos[1]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(todos[1].text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        Todo.findById(hexId).then((todo) => {
          expect(todo).toNotExist();
          done();
        }).catch((e) => done(e));
      });
  });

  it('should return 404 if todo not found', (done) => {
    var invalidId = '507f1f77bcf86cd799439011';
    request(app)
      .delete(`/todos/${invalidId}`)
      .expect(404)
      .end(done);
  });

  it('should return 404 if object id is invalid', (done) => {
    request(app)
      .delete(`/todos/123abc`)
      .expect(404)
      .end(done);
  });


});

describe('PATCH /todos/:id', () => {

  it('should update the todo', (done) => {
    var id = todos[0]._id;
    var updatedText = 'First test todo is now complete';
    request(app)
      .patch(`/todos/${id}`)
      .send({
        text: updatedText,
        completed: true
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBeA('string').toBe(updatedText);
        expect(res.body.todo.completed).toBeA('boolean').toBe(true);
        expect(res.body.todo.completedAt).toBeA('number');
      })
      .end(done);

  });

  it('should clear completedAt when completed status is removed', (done) => {
    var id = todos[1]._id;
    var updatedText = 'First test todo is now incomplete';
    request(app)
      .patch(`/todos/${id}`)
      .send({
        text: updatedText,
        completed: false
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBeA('string').toBe(updatedText);
        expect(res.body.todo.completed).toBeA('boolean').toBe(false);
        expect(res.body.todo.completedAt).toNotExist();
      })
      .end(done);
  });

  it('should return 404 if object id is invalid', (done) => {
    request(app)
      .patch(`/todos/123abc`)
      .send({text: 'abc', completed: true})
      .expect(404)
      .end(done);
  });
});

describe('GET /users/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBeA('string').toBe(users[0]._id.toHexString());
        expect(res.body.email).toBeA('string').toBe(users[0].email);
      })
      .end(done);
  });

  it('should return a 401 if not authenticated', (done) => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toBeA('object').toEqual({});
      })
      .end(done);
  });
});

describe('POST /users', () => {
  it('should create a user', (done) => {
    var email = 'example@example.com';
    var password = '123mnb';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toExist().toBeA('string');
        expect(res.body._id).toExist().toBeA('string');
        expect(res.body.email).toBeA('string').toBe(email);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }
        User.findOne({email}).then((user) => {
          expect(user).toExist();
          expect(user.password).toNotBe(password);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should return validation errors if request invalid', (done) => {
    var email = 'notanemail';
    var password = '2shrt';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toBeA('string').toBe('User validation failed');
        expect(res.body.name).toBeA('string').toBe('ValidationError');
        expect(res.body.errors.password).toExist();
        expect(res.body.errors.password.name).toBeA('string').toBe('ValidatorError');
        expect(res.body.errors.email).toExist();
        expect(res.body.errors.email.name).toBeA('string').toBe('ValidatorError');
      })
      .end(done);
  });

  it('should not create user if email already in use', (done) => {
    var duplicateEmail = 'andrew@example.com';
    var password = 'password';

    request(app)
      .post('/users')
      .send({email: duplicateEmail, password})
      .expect(400)
      .expect((res) => {
        expect(res.body.code).toBeA('number').toBe(11000);
      })
      .end(done);
  });
});

describe('POST /users/login', () => {
  it('should login user and return auth token', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password
      })
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toExist();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens[0]).toInclude({
            access: 'auth',
            token: res.headers['x-auth']
          });
          done();
        }).catch((e) => done(e));
      });
  });

  it('should reject invalid login', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password + '1'
      })
      .expect(400)
      .expect((res) => {
        expect(res.headers['x-auth']).toNotExist();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens.length).toBe(0);
          done();
        }).catch((e) => done(e));
      });
  });
});

describe('DELETE /users/me/token', () => {
  it('should remove auth token on logout', (done) => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[0]._id).then((user) => {
            expect(user.tokens.length).toBe(0);
            done();
        }).catch((e) => done(e));
      });
  });
});
