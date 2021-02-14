const { user } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.CLIENT_ID);
module.exports = {
  post: async (req, res) => {
    try {
      // 필요한 모든 정보가 전달되었는지 여부
      const { email, password } = req.body;
      if (!email || !password) {
        // 정보가 더 필요하다면 에러메시지
        res.status(400).json({ data: null, message: "should send full data" });
      }
      // body에 담긴 정보로 유저정보를 불러온다.
      const userInfo = await user.findOne({
        where: { email },
      });

      if (userInfo === null) {
        res.status(400).json({ data: null, message: "not found user" });
        return;
      }

      const isSame = await bcrypt.compare(password, userInfo.password);
      if (!isSame) {
        // 정보가 유효하지 않을 경우, 에러메시지
        res.status(400).json({
          data: null,
          message: "go away! I don't know you ",
        });
      } else {
        // 액세스 토큰 발급
        return new Promise((res, rej) => {
          jwt.sign(
            {
              // password는 토큰 정보에 담지 않음
              id: userInfo.id,
              nickname: userInfo.nickname,
              email: userInfo.email,
              image: userInfo.image,
              createdAt: userInfo.createdAt,
              updatedAt: userInfo.updatedAt,
            },
            process.env.ACCESS_SECRET,
            {
              expiresIn: "1d",
            },
            function (err, token) {
              if (err) rej(err);
              else res(token);
            }
          );
        }).then((token) => {
          // 생성된 토큰을 쿠키에 담는다.
          res.cookie("accessToken", token, {
            //domain: "localhost",
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24,
            overwrite: true,
          });
          res.status(200).json({ data: null, message: "ok" });
        });
      }
    } catch (err) {
      console.error(err);
    }
  },
  googleLogin: (req, res) => {
    let token = req.body.token;
    console.log(token);
    let userInfo = {};
    async function verify() {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID,
      });
      const payload = ticket.getPayload();
      userInfo.nickname = payload.name;
      userInfo.email = payload.email;
      userInfo.image = payload.picture;
    }
    verify()
      .then(async () => {
        const { nickname, email, image } = userInfo;
        const [result, created] = await user.findOrCreate({
          where: { email, nickname },
          defaults: { nickname, email, image },
        });
        res.cookie("oauthToken", token, {
          //domain: "localhost",
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 1000 * 60 * 60 * 24,
          overwrite: true,
        });
        res.status(200).json({ data: result, message: "ok" });
      })
      .catch(console.error);
  },
  nonMemberLogin: (req, res) => {
    try {
      // 비회원 전용 토큰 발급
      return new Promise((res, rej) => {
        jwt.sign(
          { nickname: "비회원" },
          process.env.ACCESS_SECRET,
          {
            expiresIn: "1d",
          },
          function (err, token) {
            if (err) rej(err);
            else res(token);
          }
        );
      }).then((token) => {
        // 생성된 토큰을 쿠키에 담는다.
        res.cookie("nonMemberToken", token, {
          //domain: "localhost",
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 1000 * 60 * 60 * 24,
          overwrite: true,
        });
        res.status(200).json({ data: null, message: "ok" });
      });
    } catch (err) {
      console.error(err);
    }
  }
};
