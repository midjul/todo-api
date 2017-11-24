const expect = require("expect");
const request = require("supertest");

const { app } = require("../server");
const { Todo } = require("../models/todo");
const { ObjectID } = require("mongodb");
const todos = [
  { text: "First test todo", _id: new ObjectID() },
  {
    text: "Second test todo",
    _id: new ObjectID(),
    completed: true,
    completedAt: 123
  }
];

beforeEach(done => {
  Todo.remove({})
    .then(() => {
      return Todo.insertMany(todos);
    })
    .then(() => done());
});
describe("POST /todos", () => {
  it("should create a new todo", done => {
    let text = "Test text";

    request(app)
      .post("/todos")
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
      .expect(200)
      .end((err, res) => {
        if (err) return err;

        Todo.find()
          .then(todos => {
            expect(todos.length).toBe(res.body.todos.length);
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
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it("should return 404 if todo not found", done => {
    request(app)
      .get(`/todos/${new ObjectID().toHexString()}`)
      .expect(404)
      .end(done);
  });

  it("should return 404 for non-object ids", done => {
    request(app)
      .get(`/todos/${125324}`)
      .expect(404)
      .end(done);
  });
});

describe("DELETE /todos/:id", () => {
  it("should delete one todo by id", done => {
    request(app)
      .delete(`/todos/${todos[0]._id}`)
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

  it("should return 400 if todo not found", done => {
    request(app)
      .delete(`/todos/${new ObjectID()}`)
      .expect(400)
      .end(done);
  });

  it("should return 404 for non object ids", done => {
    request(app)
      .delete(`/todos/${123}`)
      .expect(404)
      .end(done);
  });
});

describe("PATCH /todos/:id", () => {
  it("should update the todo", done => {
    request(app)
      .patch(`/todos/${todos[0]._id}`)
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

  it("should  clear completedAt when todo is not completed", done => {
    request(app)
      .patch(`/todos/${todos[1]._id}`)
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

  it("should return 404 when todo is not found", done => {
    request(app)
      .patch(`/todos/${new ObjectID()}`)
      .send({ completed: true })
      .expect(400)
      .end(done);
  });

  it("should return 404 when todo id is invalid", done => {
    request(app)
      .patch(`/todos/${123}`)
      .send({ completed: true })
      .expect(404)
      .end(done);
  });
});
