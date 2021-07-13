const FETCH_INTERVAL = process.env.FETCH_INTERVAL || 10 * 1000;
const ERROR_INTERVAL = process.env.ERROR_INTERVAL || 60 * 1000;

module.exports = {
  FETCH_INTERVAL,
  ERROR_INTERVAL
}