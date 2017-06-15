# USER PRESENCE

* Use with multiple instances: https://github.com/Konecty/meteor-multiple-instances-status
* Running example: http://user-presence-example.meteor.com/
* Example code: https://github.com/Konecty/meteor-user-presence-example-chat

This package monitors the user to track user's state and save 3 fields in user's record:
* statusDefault - Status setted by user
* statusConnection - Connection status (offline, online and away)
* status
  * Offline if **statusConnection** or **statusDefault** are offline
  * Seme as **statusConnection** if **statusDefault** is online
  * Same as **statusDefault**

## How to use

#### Add package
```shell
meteor add konecty:user-presence
```

#### Configure client
```javascript
//CLIENT
Meteor.startup(function() {
	// Time of inactivity to set user as away automaticly. Default 60000
	UserPresence.awayTime = 300000;
	// Set user as away when window loses focus. Defaults false
	UserPresence.awayOnWindowBlur = true;
	// Start monitor for user activity
	UserPresence.start();
});
```

#### Start server
```javascript
//SERVER
// Listen for new connections, login, logoff and application exit to manage user status and register methods to be used by client to set user status and default status
UserPresence.start();
// Active logs for every changes
// Listen for changes in UserSessions and Meteor.users to set user status based on active connections
UserPresenceMonitor.start();
```

#### Logs
```javascript
//SERVER
UserPresence.activeLogs();
```

### Server Methods
```javascript
// Create a new connection, this package do this automaticly
Meteor.call('UserPresence:connect');
```

```javascript
// Set connection as away, can be usefull call this method if you are using cordova to ser user as away when application goes to background for example.
Meteor.call('UserPresence:away');
```

```javascript
// Set connection as online
Meteor.call('UserPresence:online');
```

```javascript
// Changes the default status of user
Meteor.call('UserPresence:setDefaultStatus', 'busy');
```
