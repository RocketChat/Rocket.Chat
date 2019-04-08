## vNEXT

## v0.3.4

- Explicitly pull in client-side `check` for Meteor 1.2 apps. 

## v0.3.3

- Be more robust with sync url when outside of Cordova. (#30) 

## v0.3.2

- Fix issue when used in Cordova. (#22, #26, #27)

## v0.3.1

- Fix an issue where `TimeSync.serverTime` returned an erroneous value when passed a `Date` (instead of an epoch). (#23)

## v0.3.0

- `TimeSync.serverTime` now supports an optional second `updateInterval` argument, causing the reactive value to update less frequently. (#10)
- `TimeSync.loggingEnabled` can be now set to false to suppress client log output. (#21)
- Explicitly set MIME type on timesync endpoint. (#17, #18)

## v0.2.2

- **Updated for Meteor 0.9.**
- Further adjust clock watching tolerance to be less sensitive to CPU.

## v0.2.1

- Re-sync automatically after a reconnection.
- Adjust clock watching tolerance so as to be less sensitive to heavy client CPU usage.

## v0.2.0

- Clock change watching is now on by default (it's very lightweight and only involves grabbing and checking a `Date`).
- Invalidate offset value and dependent time computations when we detect a clock change.
- Added a `Date.now` shim for earlier versions of IE.
- Reorganized code for testing and added some basic tests.

## v0.1.6

- Added the optional `TimeSync.watchClockChanges` which can resync if a client's clock is detected to have significantly changed.
- Added retry attempts to syncing, making it more robust over a hot code reload among other situations.

## v0.1.5

- Use `WebApp.rawConnectHandlers` as a less janky way of getting our date request handled first.
- Fixed an issue where a cached reload could result in a wacky time offset due to the server time being cached.

## v0.1.4

- Switch to JS at the request of @raix and @arunoda ;-)
- Use a middleware handler, spliced into the top of the connect stack, instead of a Meteor method to avoid arbitrary method blocking delay. This improves accuracy significantly.
- Compute a RTT value in `TimeSync.roundTripTime` as well as a time offset.

## v0.1.3

- Ensure that the computed offset is always an integer number of milliseconds.

## v0.1.2

- Added the `TimeSync.resync` function that triggers a resync with the server.

## v0.1.1

- Added the reactive function `TimeSync.isSynced` to determine if an initial sync has taken place.

## v0.1.0

- First release.
