# 1.2.9 (2016-09-09)
* Fix #16; Prevent error when proccess exit
* Fix ESLint errors

# 1.2.8 (2016-05-25)
* Add _.throttle to set online status

# 1.2.7 (2016-05-25)
* Remove observeChanges on the users collection
* Accept multiple callbacks for status change

# 1.2.6 (2015-09-12)
* Add option to passa a callback to setUserStatus on UserPresenceMonitor

# 1.2.5 (2015-08-11)
* Set user online on touch events too

# 1.2.4 (2015-08-03)
* Add callback *onSetUserStatus* to watch status changes

# 1.2.3 (2015-07-25)
* Added this.ready to publication

# 1.2.2 (2015-02-11)
* Use Accounts if package 'accounts-base' exists

# 1.2.1 (2015-02-04)
* Create index for 'connections.id' to improve performance

# 1.2.0 (2015-02-04)
* Move api common.js file to top of list
* Create index for 'connections.instanceId' to improve performance
* Do not process removal of users
* Only process user changes that affects the field 'statusDefault'
* Pass action names to processUserSession
* Do not process removed sessions with no connections
* Remove sessions with no connections

# 1.1.0 (2015-02-02)
* Allow visitor status tracking
* Prevent error when no user was not found in setUserStatus

# 1.0.15 (2015-01-21)
* Allow pass status to createConnection
* Update field '_updatedAt' of connection when update connection status
* Change setConnection to use update instead upsert and recreate connection if no connetion exists

# 1.0.14 (2015-01-21)
* Improve latency compensation

# 1.0.13 (2015-01-21)
* Set user into connection on login to only remove connections with user

# 1.0.12 (2015-01-21)
* Add this.unblock() to all methods
