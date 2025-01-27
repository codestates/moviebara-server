const jwt = require('jsonwebtoken');
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);
module.exports = {
  post: async (req, res) => {
    if(req.cookies.accessToken) {
      jwt.verify(req.cookies.accessToken, process.env.ACCESS_SECRET, (err, result) => {
        if(err) {res.status(400).json({
          data: null,
          message: "invalid access token"
        })} else {
          res.clearCookie('accessToken', {
            //domain: "localhost",
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 1000 * 60 * 60 * 24,
            overwrite: true,
          });
          res.status(200).json({ data: null, message: 'ok' })    
        }
      })
    } else if (req.cookies.oauthToken) {
      const ticket = await client.verifyIdToken({
        idToken: req.cookies.oauthToken,
        audience: process.env.CLIENT_ID
      });
      const payload = ticket.getPayload();
      if(payload) {
        res.clearCookie('oauthToken', {
          //domain: "localhost",
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 1000 * 60 * 60 * 24,
          overwrite: true,
        });
        res.status(200).json({ data: null, message: 'ok' })   
      }
    } else {
      res.status(400).json({ data: null, message: 'Please login first' })
    }
  }
}