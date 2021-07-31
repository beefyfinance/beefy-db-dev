const UPDATE_INTERVAL = process.env.UPDATE_INTERVAL || 5 * 60;
const SNAPSHOT_INTERVAL = process.env.SNAPSHOT_INTERVAL || 15 * 60;
const DATABASE_URL = process.env.DATABASE_URL;
const PORT = process.env.PORT || 3000;

module.exports = {
  UPDATE_INTERVAL,
  SNAPSHOT_INTERVAL,
  DATABASE_URL,
  PORT
}