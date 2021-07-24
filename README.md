# beefy-db

EXTREMELY QUICK AND DIRTY REPO.

CLEANUP AND MIGRATE BEFORE OPEN SOURCING!!! SRSLY

## TL;DR

https://beefy-db.herokuapp.com/apy?name=bifi-maxi&from=1626336000&to=1626339600

## Overview

This app is composed of 2 simple modules:
1. `data` periodically fetches info from the api and stores it in a database
2. `api` basic koa server that allows us to query the stored data

`data` is initialized automatically the first time it runs, it should be quite fast to plug it into a new database, just replace `DATABASE_URL` with a full connection string.

It has been designed and tested using pg, since that is what Heroku offers. But should be farily easy to migrate in the future.

`api` is still in heavy development however, the interface should remain the same, so we can start plugging it to v2 already.

## Env
dotenv is automatically loaded when running the app via `yarn start`

DATABASE_URL=...

PORT=...

## Notes
Doesn't scale horizontally (yet).

The data module keeps track of the last snapshot in a local file, so redundant instances will duplicate data.

## Endpoints 

```
/apy?name=...&from=...&to=...&group=...
```
Fetches data from https://api.beefy.finance/apy/breakdown

```
/price?name=...&from=...&to=...&group=...
```
Fetches data from https://api.beefy.finance/price

```
/tvl?name=...&from=...&to=...&group=...
```
Fetches data from https://api.beefy.finance/tvl

## Query string

`name` uses the same key as the data source

`from` and `to` are unix timestamps in seconds

`period`: microseconds, milliseconds, second, minute, hour, day, week, month, quarter, year, decade, century, millennium

`order` asc (default) / desc

`limit` max number of rows to return
