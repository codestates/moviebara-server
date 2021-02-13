const { post, movie, user, scrap } = require("../models");
const sequelize = require("sequelize");

module.exports = {
  post: async (req, res) => {
    try {
      const { text, rate, userId, movieId } = req.body;
      if (text && rate && userId && movieId) {
        await post.create({ text, rate, userId, movieId });
        res.status(200).json({ data: null, message: "ok" });
      } else {
        res.status(400).json({ data: null, message: "should send full data" });
      }
    } catch (err) {
      console.error(err);
    }
  },
  getPostById: async (req, res) => {
    try {
      const query = req.query;
      if (query.user_id) {
        const postByUser = await post.findAll({
          attributes: ["id", "text", "rate", "createdAt", [sequelize.fn("COUNT", sequelize.col("scraps.id")), "scrap"]],
          include: [
            { model: scrap, attributes: [] },
            { model: user, attributes: ["nickname", "image"] },
            { model: movie, attributes: ["title", "image", "genre"] }
          ],
          group: ["id"],
          where: { userId: query.user_id },
        });
        if (postByUser) res.status(200).json({ data: postByUser, message: "ok" });
        else res.status(400).json({ data: null, message: "There's no post of user" });
      }
      if (query.movie_id) {
        const postByMovie = await post.findAll({
          attributes: ["id", "text", "rate", "createdAt", [sequelize.fn("COUNT", sequelize.col("scraps.id")), "scrap"]],
          include: [
            { model: user, attributes: ["nickname", "image"] },
            { model: scrap, attributes: [] },
            { model: movie, attributes: ["title", "image", "genre"] }
          ],
          group: ["id"],
          where: { movieId: query.movie_id }
        });
        if (postByMovie) res.status(200).json({ data: postByMovie, message: "ok" });
        else res.status(400).json({ data: null, message: "There's no post of user" });
      }
    } catch (err) {
      console.error(err);
    }
  },
  updatePost: async (req, res) => {
    try {
      const { postId, text, rate, userId, movieId } = req.body;
      if (text && rate && userId && movieId) {
        await post.update({ text, rate }, { where: { id: postId } });
        res.status(200).json({ data: null, message: "update success" });
      } else {
        res.status(400).json({ data: null, message: "should send full data" });
      }
    } catch (err) {
      console.error(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      const { postId } = req.body;
      if (postId) {
        await post.destroy({ where: { id: postId } });
        res.status(200).json({ data: null, message: "delete success" });
      } else {
        res.status(400).json({ data: null, message: "should send postId" });
      }
    } catch (err) {
      console.error(err);
    }
  }
}