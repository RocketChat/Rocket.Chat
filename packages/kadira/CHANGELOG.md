# Changelog

### v2.30.2

Fix [#144](https://github.com/meteorhacks/kadira/issues/144).

### v2.30.0

* Stop sending hostname to the client side. See [#245](https://github.com/meteorhacks/kadira/issues/245).

### v2.29.1

* Remove MongoDB labeling. See: [PR239](https://github.com/meteorhacks/kadira/pull/239)

### v2.29.0

* DocSzCache size is now configurable. See [PR238](https://github.com/meteorhacks/kadira/pull/238)

### v2.28.7
20-05-2016

* Use kadira-core@1.3.2

### v2.28.6
12-05-2016

* Fix an issue of potentially, killing the due to CPU labeling of the MongoDB module.

### v2.28.5
09-03-2016

* Fix coding style issues
* Track polledDocSize on polling observers as well

### v2.28.4
04-03-2016

* Fix regression of not tracking size data correctly. See: [#219](https://github.com/meteorhacks/kadira/pull/219)

### v2.28.3
04-03-2016

* Fix re-opened bug [#83](https://github.com/meteorhacks/kadira/issues/83) which tries to use update options when it's undefined or null. This came with the recent addition of size tracking.

### v2.28.2
01-03-2016

* Fix issue of not tracking null publications properly in data size tracking.

### v2.28.1

* Remove cache handlers tracking from observers. This leads to better CPU usage.

### v2.28.0

* Tracking different data size meterics (all in and out data sizes from the app). This is done is very efficient manner. So, this doesn't impact to the app's CPU usage.

### v2.27.3

* Update pidusage to v1.0.1

### v2.27.2

* Fix potential issue of not sending data to engine. Earlier we stopped sending when we see an error. Actually, we need to reschedule to send data to engine even if there is an error.

### v2.27.1

* Fix an issue on server crashing due to a bug on kadira-core. Fixed by adding kadira-core v1.3.1, which has a fix for that.

### v2.27.0

* Now, transport layer is handled by the `kadira-core` NPM module.

### v2.26.3
* Add potential fix for #200

### v2.26.2
* Add initiallyAddedDocuments to track initial adds

### v2.26.1
* Change the metrics we track for LiveQuery tracking.

### v2.26.0
* Add more metrics which tracks the Live Query usage. This will be helpful for our upcoming LiveQuery tracking feature.

### v2.25.0
* Allow to filter by method/sub name when striping trace data. See this [PR](https://github.com/meteorhacks/kadira/pull/195).

### v2.24.1
* Add better error reporting. Actually fixed this issue: https://github.com/meteorhacks/kadira/issues/193
* How we fix is little unconventional but it worked.

### v2.24.0
* Start instrumenting Kadira rightway. So, we can get the CPU profile labeling.

### v2.23.6

* Using MeteorX for the server only.

### v2.23.5

* Using the latest MeteorX version, which has some fixes for startup related issues

### v2.23.4
* Fix for a weird bug we found from the customer support. Without this fix, his app won't bind to the port.

### v2.23.3
* Fix a potential issue where the possiblity to mutate authHeaders.

### v2.23.2
* Change console.error in connect code to console.log.

### v2.23.1

* Add support for Meteor 1.2. Fixes: [#181](https://github.com/meteorhacks/kadira/issues/181). It was an issue with how we are tracking `Fiber.yield`.

### v2.23.0
* Add first steps on decoupling kadira's tracing into a seperate package.
* With this version, we allow an way to expose Kadira traces and some other metrics without connecting to Kadira.
* See example: https://gist.github.com/arunoda/8a3dec21924f08ed83b3

### v2.22.1
* Prevnt string errors crashing the app. Potential fix for: [#175](https://github.com/meteorhacks/kadira/issues/175)

### v2.22.0
* We've seen some users getting older version when installed via `meteor add meteorhacks:kadira`. We've no idea when it's happening. May be because we still support Meteor `0.9`.
* So, this version drops Meteor `0.9` support and only support Meteor `1.0` or higher.

### v2.21.0

* Fix an issue with the time-sync logic
* Do not retry if kadira engine return a status code of range 400-500 (except 401. It throws an error.)
* Add the protocol version as 1.0.0
