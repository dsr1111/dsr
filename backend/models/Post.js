const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, default: "익명" },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
  comments: { type: Array, default: [] }
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
