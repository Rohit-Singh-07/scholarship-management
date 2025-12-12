require("dotenv").config();

const app = require("./app");
const { connect } = require("./config/db");  


if (process.env.NODE_ENV !== "test") {
  require("./config/redis");
}

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
  connect();  

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
