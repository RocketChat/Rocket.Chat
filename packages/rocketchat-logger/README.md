# Logger

Constructor
```javascript
new Logger(name, options);
```

options
* **sections**: An object of sections
* **methods**: An object of new methods

Example
```javascript
const logger = new Logger('LDAP', {
  sections: {
    connection: 'Connection',
    bind: 'Bind',
    search: 'Search',
    auth: 'Auth'
  }
});
```

Usage
```javascript
logger.info('connecting');
// LDAP ➔ info connecting

logger.connection.info('connecting');
// LDAP ➔ Connection.info connecting
```

Sections have all avaliable methods methods, the default methods are:
```javascript
debug:
  name: 'debug'
  color: 'blue'
  level: 2
log:
  name: 'info'
  color: 'blue'
  level: 1
info:
  name: 'info'
  color: 'blue'
  level: 1
success:
  name: 'info'
  color: 'green'
  level: 1
warn:
  name: 'warn'
  color: 'magenta'
  level: 1
error:
  name: 'error'
  color: 'red'
  level: 0
```

The method **error** will always log the file and line of method execution


# LoggerManager (singleton)

You can enable, disable, or set the log level for all logs here.
You can show the origin package and file/line from all logs here.

```javascript
LoggerManager.enabled = false;
LoggerManager.showPackage = false;
LoggerManager.showFileAndLine = false;
LoggerManager.logLevel = 0;
```

The **LoggerManager** starts disabled, you should enable in some point, if you want to print all logs queued while disabled use:
```javascript
LoggerManager.enable(true);
```
