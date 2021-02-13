const { user } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Op = require("sequelize").Op;
const AWS = require("aws-sdk");
const fs = require("fs");

module.exports = {
  get: async (req, res) => {
    try {
      const token = req.cookies.accessToken;
      jwt.verify(token, process.env.ACCESS_SECRET, async (error, result) => {
        const myInfo = await user.findOne({
          where: { id: result.id },
          attributes: { exclude: ["password"] },
        });
        if (myInfo) res.status(200).send({ data: myInfo, message: "ok" });
        else res.status(400).send({ data: null, message: "invalid user" });
      });
    } catch (err) {
      console.error(err);
    }
  },
  signUp: async (req, res) => {
    try {
      const { nickname, password, email } = req.body;
      const sameNickname = await user.findOne({ where: { nickname } });
      const sameEmail = await user.findOne({ where: { email } });

      if (sameNickname) {
        res.status(400).json({ data: null, message: "existed nickname" });
      } else if (sameEmail) {
        res.status(400).json({ data: null, message: "existed email" });
      } else {
        const salt = await bcrypt.genSalt();
        const pwd = await bcrypt.hash(password, salt);
        if (nickname && password && email) {
          await user.create({ nickname, password: pwd, email });
          res.status(200).json({ data: null, message: "welcome!" });
        } else {
          res
            .status(400)
            .json({ data: null, message: "should send full data" });
        }
      }
    } catch (err) {
      console.error(err);
    }
  },
  getUserById: async (req, res) => {
    try {
      const id = req.params.user_id;
      const userInfo = await user.findOne({
        attributes: ["nickname", "email", "image"],
        where: { id },
      });
      if (!userInfo)
        res.status(404).json({ data: null, message: "invalid user" });
      else res.status(200).json({ data: userInfo, message: "ok" });
    } catch (err) {
      console.error(err);
    }
  },
  updateUserInfo: async (req, res) => {
    try {
      const token = req.cookies.accessToken;
      jwt.verify(token, process.env.ACCESS_SECRET, async (error, result) => {
        const { nickname, password } = req.body;

        const sameNickname = await user.findOne({
          where: { nickname, id: { [Op.ne]: result.id } },
        });
        if (sameNickname) {
          res.status(400).json({ data: null, message: "existed nickname" });
        } else {
          const salt = await bcrypt.genSalt();
          const pwd = await bcrypt.hash(password, salt);

          const s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          });

          if (req.file !== undefined) {
            const param = {
              Bucket: "moviebara",
              Key:
                "image/" + nickname + "profile" + new Date().getTime() + ".jpg",
              ACL: "public-read",
              Body: req.file.buffer,
            };

            s3.upload(param, async function (err, data) {
              await user.update(
                { nickname, image: data.Location, password: pwd },
                { where: { id: result.id } }
              );
              res.status(200).json({ data: null, message: "update success" });
            });
          } else {
            await user.update(
              { nickname, password: pwd },
              { where: { id: result.id } }
            );
            res.status(200).json({ data: null, message: "update success" });
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  },
  checkPassword: async (req, res) => {
    try {
      const token = req.cookies.accessToken;
      jwt.verify(token, process.env.ACCESS_SECRET, async (error, result) => {
        const userInfo = await user.findOne({ where: { id: result.id } });
        const isSame = await bcrypt.compare(
          req.body.password,
          userInfo.password
        );
        if (isSame)
          res.status(200).json({ data: null, message: "same password" });
        else res.status(400).json({ data: null, message: "wrong password" });
      });
    } catch (err) {
      console.error(err);
    }
  },
};
