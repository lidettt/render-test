const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const Note = require("./models/note");

const requestLogger = (request, response, next) => {
  console.log("Method : ", request.method);
  console.log("Path : ", request.path);
  console.log("Body : ", request.body);
  console.log("---");
  next();
};
app.use(express.json());
app.use(cors());
app.use(requestLogger);
app.use(express.static("dist"));
app.get("/", (request, response) => {
  response.send("<h1>Hello World!</h1>");
});
// route for getting all the notes
app.get("/api/notes", (request, response) => {
  Note.find({}).then((notes) => response.json(notes));
});

//route for adding data (new note)
app.post("/api/notes", (request, response) => {
  const body = request.body;
  if (!body.content) {
    return response.status(400).json({ error: "content missing" });
  }
  const note = new Note({
    content: body.content,
    important: body.important || false,
  });

  note.save().then((savedNote) => {
    response.json(savedNote);
  });
});
//route for fetching a single resource
app.get("/api/notes/:id", (request, response) => {
  Note.findById(request.params.id)
    .then((note) => {
      if (note) {
        response.json(note);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});
app.delete("/api/notes/:id", (request, response) => {
  Note.findByIdAndDelete(request.params.id)
    .then((result) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});
app.put("/api/notes/:id", (request, response) => {
  const { content, important } = request.body;
  Note.findById(request.params.id).then((note) => {
    if (!note) {
      return response.status(404).end();
    }
    note.content = content;
    note.important = important;
    return note
      .save()
      .then((updatedNote) => {
        response.json(updatedNote);
      })
      .catch((error) => next(error));
  });
});

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};
app.use(unknownEndpoint);
const PORT = process.env.PORT;
app.listen(PORT);
console.log(`Server running on port ${PORT}`);

const errorHandler = (error, request, response, next) => {
  console.log(error.message);
  if (error.name === "CastError") {
    return response.status(400).send({ error: "malfomatted id" });
  }
  next(error);
};
// this has to be the last loaded middleware, also all the routes should be registered before this!
app.use(errorHandler);
