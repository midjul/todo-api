const expect = require("expect");
const request = require("supertest");

const { app } = require("../server");
const { Todo } = require("../models/todo");
const { User } = require("../models/user");
const { ObjectID } = require("mongodb");
const { todos, populateTodos, users, populateUsers } = require("./seed/seed");
beforeEach(populateUsers);
beforeEach(populateTodos);

describe("POST /todos", () => {
  it("should create a new todo", done => {
    let text = "Test text";

    request(app)
      .post("/todos")
      .set("x-auth", users[0].tokens[0].token)
      .send({ text })
      .expect(200)
      .expect(res => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({ text })
          .then(todos => {
            expect(todos.length).toBe(1);
            expect(todos[0].text).toBe(text);
            done();
          })
          .catch(e => done(e));
      });
  });

  it("should not create todo with invalid body data", done => {
    request(app)
      .post("/todos")
      .set("x-auth", users[0].tokens[0].token)
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);

        Todo.find()
          .then(todos => {
            expect(todos.length).toBe(2);
            done();
          })
          .catch(e => done(e));
      });
  });
});

describe("GET /todos", () => {
  it("should get all todos", done => {
    request(app)
      .get("/todos")
      .set("x-auth", users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        Todo.find()
          .then(todos => {
            expect(res.body.todos.length).toBe(1);
            // expect(todos).toEqual(res.body.todos);
            done();
          })
          .catch(e => done(e));
      });
  });
});

describe("GET /todos/:id", () => {
  it("should return todo doc", done => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .set("x-auth", users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it("should not return todo doc created by other user", done => {
    request(app)
      .get(`/todos/${todos[1]._id.toHexString()}`)
      .set("x-auth", users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it("should return 404 if todo not found", done => {
    request(app)
      .get(`/todos/${new ObjectID().toHexString()}`)
      .set("x-auth", users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it("should return 404 for non-object ids", done => {
    request(app)
      .get(`/todos/${125324}`)
      .set("x-auth", users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe("DELETE /todos/:id", () => {
  it("should delete one todo by id", done => {
    request(app)
      .delete(`/todos/${todos[0]._id}`)
      .set("x-auth", users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        Todo.findById(todos[0]._id)
          .then(doc => {
            expect(doc).toBe(null);
            expect(res.body.todo.text).toBe(todos[0].text);
            expect(res.body.todo._id).toBe(todos[0]._id.toHexString());
            done();
          })
          .catch(err => done(err));
      });
  });

  it("should not delete todo created by other user", done => {
    request(app)
      .delete(`/todos/${todos[0]._id}`)
      .set("x-auth", users[1].tokens[0].token)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        Todo.findById(todos[0]._id)
          .then(doc => {
            console.log("doc");
            expect(doc.text).toBe(todos[0].text);
            done();
          })
          .catch(err => done(err));
      });
  });

  it("should return 400 if todo not found", done => {
    request(app)
      .delete(`/todos/${new ObjectID()}`)
      .set("x-auth", users[0].tokens[0].token)
      .expect(400)
      .end(done);
  });

  it("should return 404 for non object ids", done => {
    request(app)
      .delete(`/todos/${123}`)
      .set("x-auth", users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe("PATCH /todos/:id", () => {
  it("should update the todo", done => {
    request(app)
      .patch(`/todos/${todos[0]._id}`)
      .set("x-auth", users[0].tokens[0].token)
      .send({ completed: true, text: "test update" })
      .expect(200)
      .end((err, res) => {
        if (err) done(err);
        Todo.findById(todos[0]._id)
          .then(doc => {
            expect(doc.completed).toBeTruthy();
            expect(doc.text).toBe("test update");

            expect(res.body.todo.completedAt).toBe(doc.completedAt);
            done();
          })
          .catch(err => done(err));
      });
  });

  it("should not update the todo created by other user", done => {
    request(app)
      .patch(`/todos/${todos[0]._id}`)
      .set("x-auth", users[1].tokens[0].token)
      .send({ completed: true, text: "test update" })
      .expect(400)
      .end((err, res) => {
        if (err) done(err);
        Todo.findById(todos[0]._id)
          .then(doc => {
            expect(doc.completed).toBe(false);
            expect(doc.text).toBe(todos[0].text);

            expect(doc.completedAt).toBe(null);
            done();
          })
          .catch(err => done(err));
      });
  });

  it("should  clear completedAt when todo is not completed", done => {
    request(app)
      .patch(`/todos/${todos[1]._id}`)
      .set("x-auth", users[1].tokens[0].token)
      .send({ completed: false, text: "new test todo" })
      .expect(200)
      .end((err, res) => {
        if (err) done(err);
        expect(res.body.todo.completedAt).toBe(null);
        expect(res.body.todo.completed).toBeFalsy();
        expect(res.body.todo.text).toBe("new test todo");
        done();
      });
  });

  it("should return 400 when todo is not found", done => {
    request(app)
      .patch(`/todos/${new ObjectID()}`)
      .set("x-auth", users[0].tokens[0].token)
      .send({ completed: true })
      .expect(400)
      .end(done);
  });

  it("should return 404 when todo id is invalid", done => {
    request(app)
      .patch(`/todos/${123}`)
      .set("x-auth", users[0].tokens[0].token)
      .send({ completed: true })
      .expect(404)
      .end(done);
  });
});

describe("GET /users/me", () => {
  it("should return user if authenitcated", done => {
    request(app)
      .get(`/users/me`)
      .set("x-auth", users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);
  });
  it("should return 401 if not authenticated", done => {
    request(app)
      .get(`/users/me`)
      .expect(401)
      .expect(res => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe("POST /users", () => {
  it("should create a users", done => {
    const user = { email: "djulovic_m@hotmail.com", password: "123abcd" };
    request(app)
      .post("/users")
      .send(user)
      .expect(200)
      .expect(res => {
        expect(res.headers["x-auth"]).toBeTruthy();
        User.findById(res.body._id)
          .then(doc => {
            if (!doc) throw new Error("User not found");
            expect(doc.email).toBe(user.email);
            //expect(doc.password).toNotBe(user.password);
            expect(doc.tokens[0].access).toBe("auth");
          })
          .catch(e => done(e));
      })
      .end(done);
  });
  it("should return validation errors if password invalid", done => {
    request(app)
      .post("/users")
      .send({ email: "mail@mail.com", password: 1 })
      .expect(400)
      .expect(res => {
        expect(res.body.errors.password.message).toBe(
          "Path `password` (`1`) is shorter than the minimum allowed length (6)."
        );
      })
      .end(done);
  });
  it("should not create user if email in use", done => {
    request(app)
      .post("/users")
      .send({ email: users[0].email, password: 1234567 })
      .expect(400)
      .end(done);
  });
});

describe("POST /users/login", () => {
  it("should login user and return auth token", done => {
    request(app)
      .post("/users/login")
      .send({ email: users[1].email, password: users[1].password })
      .expect(200)
      .expect(res => {
        expect(res.headers["x-auth"]).toBeTruthy();
        User.findById(res.body._id)
          .then(user => {
            expect(user.email).toBe(users[1].email);
            expect(res.headers["x-auth"]).toBe(user.tokens[1].token);
          })
          .catch(err => done(err));
      })
      .end(done);
  });
  it("should reject invalid login", done => {
    request(app)
      .post("/users/login")
      .send({ email: users[1].email, password: 12233455 })
      .expect(400)
      .expect(res => {
        expect(res.headers["x-auth"]).toBeFalsy();

        User.findById(users[1]._id)
          .then(user => {
            expect(user.email).toBe(users[1].email);
            expect(user.tokens.length).toBe(1);
          })
          .catch(err => done(err));
      })
      .end(done);
  });
});

describe("DELETE /users/me/token", () => {
  it("should remove auth token on logout", done => {
    request(app)
      .delete("/users/me/token")
      .set("x-auth", users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        User.findById(users[0]._id)
          .then(user => {
            expect(user.tokens.length).toBe(0);
            done();
          })
          .catch(e => done(e));
      });
  });
});
