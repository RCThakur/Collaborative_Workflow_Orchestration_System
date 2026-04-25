const jwt = require("jsonwebtoken");

const generateInviteToken = (projectId) => {
  return jwt.sign({ projectId }, process.env.INVITE_TOKEN_SECRET, {
    expiresIn: "30m",
  });
};

module.exports = generateInviteToken;
