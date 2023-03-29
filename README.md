# beefy-db

## TL;DR

http://localhost:4000/api/v2/ranges?oracle=BNB&vault=venus-bnb

http://localhost:4000/api/v2/prices?oracle=BNB&bucket=4h_3M

http://localhost:4000/api/v2/apys?vault=venus-bnb&bucket=4h_3M

http://localhost:4000/api/v2/tvls?vault=venus-bnb&bucket=4h_3M

## Overview

This app is composed of 2 simple modules:
1. `snapshot` periodically fetches info from the api and stores it in a database
2. `api` basic fastify server that allows us to query the stored data

## Env
`.env` is automatically loaded when running the app via `yarn dev:*` commands.

`.env.example` contains an example set of variables for development

### Variables

`DATABASE_URL` - postgres connection string

`DATABASE_SSL` - false: no SSL, true: SSL, default: SSL allowing self-signed certs 

`PORT` - port to run the api on, default: 4000

`API_CORS_ORIGIN` - RegExp for CORS origin, default: `^(https:\/\/app\.beefy\.(com|finance)|http:\/\/localhost(:[0-9]+)?)$`

`SNAPSHOT_INTERVAL` - interval in seconds between snapshots, default: 900 (15 minutes)

`SNAPSHOT_RETRY_DELAY` - delay in seconds between snapshot retries, default: 60 (1 minute)

`SNAPSHOT_RETRY_MAX` - max number of retries, default: 5 (`SNAPSHOT_RETRY_DELAY * SNAPSHOT_RETRY_MAX` must be less than `SNAPSHOT_INTERVAL`)

`NODE_ENV` - development / production, default: development - CSP/CORS is disabled when not production

`LOG_LEVEL` - 'fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent', default: 'info' - you may want to set this to warn or above for production

## Commands

### Development
`yarn dev:migrate` - run database migrations via ts-node

`yarn dev:snapshot` - run the snapshot module via ts-node

`yarn dev:api` - run the api module via ts-node

### Production
`yarn build` - compile typescript to javascript

`yarn migrate` - run database migrations

`yarn snapshot` - run the snapshot module

`yarn api` - run the api module

### Heroku

Heroku will automatically run the `build` command (via `package.json`) on deploy.

Heroku will automatically run the `migrate` command (via `Procfile`) on release.

The `snapshot` module is run via the `worker` process (see `Procfile`).

The `api` module is run via the `web` process (see `Procfile`).

## Logging

Logging is handled by [pino](https://github.com/pinojs/pino) 

Pino outputs logs in JSON format to stdout. In development this is then piped to [pino-pretty](https://github.com/pinojs/pino-pretty) for pretty printing.

## Endpoints 

### Ranges
#### Url
`/api/v2/ranges?oracle={oracleId}&vault={vaultId}`

#### Query string
`oracle` - a price oracle id, e.g. `BNB`

`vault` - a vault id, e.g. `venus-bnb`

#### Response
```json
{
  "apys": {
    "min": "1627759800",
    "max": "1679023800"
  },
  "tvls": {
    "min": "1627759800",
    "max": "1679023800"
  },
  "prices": {
    "min": "1627759800",
    "max": "1679023800"
  }
}
```

### Prices
#### Url
`/api/v2/prices?oracle={oracleId}&bucket={bucket}`

#### Query string
`oracle` - a price oracle id, e.g. `BNB`

`bucket` - a bucket, size_range e.g. `1h_1d | 1h_1w | 1d_1M | 1d_1Y`

### Response
```json
[
  {
    "t": 1671244200,
    "v": 0.002845395315750137
  }
]
```

`t` - timestamp in seconds, start of bucket

`v` - high for bucket

### APYs
#### Url
`/api/v2/apys?vault={vaultId}&bucket={bucket}`

#### Query string
`vault` - a vault id, e.g. `venus-bnb`

`bucket` - as above

### Response
as above for prices

### TVLs
#### Url
`/api/v2/tvls?vault={vaultId}&bucket={bucket}`

#### Query string
`vault` - a vault id, e.g. `venus-bnb`

`bucket` - as above

### Response
as above for prices

## Migrations

Database migrations are handled by [postgrator](https://github.com/rickbergfalk/postgrator) and are available in `/migrations/`