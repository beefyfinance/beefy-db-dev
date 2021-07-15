const UPDATE_INTERVAL = process.env.UPDATE_INTERVAL || 15 * 60 * 1000;
const DATABASE_URL = process.env.DATABASE_URL;
const PORT = process.env.PORT || 3000;

module.exports = {
  UPDATE_INTERVAL,
  DATABASE_URL,
  PORT
}