---
"@rocket.chat/meteor": patch
---

fix: immediate auto reload issues

Immediate auto reload increases server load on restarts/upgrades and increases the chance of getting 404 on Meteor's config file blocking the UI on a loading screen

This change adds delays on front and backend codes on automatic client reload:

- Front-end, adds a warning message including the old and new hashes, and a delay of 60 seconds after being notified by the server
- Back-end, delays the client notifications on a random value between 2 and 10 minutes per connection, allowing different clients to reload at different moments and distributing the load along the time.
