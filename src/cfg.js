const UPDATE_INTERVAL = process.env.UPDATE_INTERVAL || 10 * 1000;
const ERROR_INTERVAL = process.env.ERROR_INTERVAL || 60 * 1000;

module.exports = {
  UPDATE_INTERVAL,
  ERROR_INTERVAL
}