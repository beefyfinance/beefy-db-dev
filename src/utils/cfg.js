const UPDATE_INTERVAL = process.env.UPDATE_INTERVAL || 5 * 60 * 1000;
const DATABASE_URL = process.env.DATABASE_URL;

module.exports = {
  UPDATE_INTERVAL,
  DATABASE_URL
}