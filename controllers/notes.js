const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const notesRouter = require("express").Router();
const Note = require("../models/note");
const User = require("../models/user");
// route for getting all the notes
notesRouter.get("/", async (request, response) => {
  const notes = await Note.find({}).populate("user", { username: 1, name: 1 });
  response.json(notes);
});
//route for fetching a single resource
notesRouter.get("/:id", async (request, response) => {
  const id = request.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).json({ error: "invalid id" });
  }
  const note = await Note.findById(id);

  if (note) {
    response.json(note);
  } else {
    response.status(404).end();
  }
});
notesRouter.delete("/:id", async (request, response) => {
  await Note.findByIdAndDelete(request.params.id);
  response.status(204).end();
});

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "");
  }
  return null;
};
//route for adding data (new note)
notesRouter.post("/", async (request, response) => {
  const body = request.body;
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: "token invalid" });
  }
  const user = await User.findById(decodedToken.userId);
  if (!body.content) {
    return response.status(400).json({ error: "content missing" });
  }
  if (!user) {
    return response.status(400).json({ error: "userId missing or not valid" });
  }
  const note = new Note({
    content: body.content,
    important: body.important || false,
    user: user._id,
  });

  const savedNote = await note.save();
  user.notes = user.notes.concat(savedNote._id);
  await user.save();
  response.status(201).json(savedNote);
});

notesRouter.put("/:id", (request, response, next) => {
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
      .catch((error) => {
        next(error);
      });
  });
});

module.exports = notesRouter;
