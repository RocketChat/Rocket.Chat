This package provides an interface to access Postgresql database from the
application server, as well publishing data to the client and maintaining the
client-side cache.



## Observe Driver

The current observe driver is a rewritten and modified version of the driver
written [by Ben Green](https://github.com/numtel/pg-live-select).

The driver currently only works with Postresql and here is how it works (polling
driver):

- Define a trigger on every table we are interested in
- When a write occurs, the trigger broadcasts a notification with the payload
  representing the new value of the row (there could be multiple notifications,
  due to PG's limit on the length)
- The application servers listen to these notifications and based on the payload
  can decide to poll or not to poll (based on the invalidation callbacks)
- If the application decides to poll, it sends a list of known hashes of the
  rows into Postgresql (if `poll.sql` is used) and the PG returns only rows that
  has changed
  * An alternative method, `poll-n-diff.sql` diffs the changes against a
    temporary table purely inside the Postgresql server



