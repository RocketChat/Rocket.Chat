# webapp
[Source code of released version](https://github.com/meteor/meteor/tree/master/packages/webapp) | [Source code of development version](https://github.com/meteor/meteor/tree/devel/packages/webapp)
***

The `webapp` package contains the core functionality that makes a
Meteor project into a web application. It is a "value added HTTP
server" that includes not just a web server, but also advanced app
serving functionality like over-the-air mobile app updates and HTML5
Appcache support. For more information, see the [Webapp project
page](https://github.com/meteor/meteor/tree/master/packages/webapp).


## Direct access to connect mongodb API

The `webapp` package is implemented using the
[`express`](https://expressjs.com/).  `webapp` exposes
the express API for handling requests through `Webapp.handlers`.  See
https://docs.meteor.com/#/full/webapp for more details

If you'd like direct access to the express module (for example, to use one of
the middleware handlers that it defines), you can find it at
`WebAppInternals.NpmModules.express.module`. Its version can be read at
`WebAppInternals.NpmModules.express.version`.

The version of `express` used may change incompatibly from version to version of
Meteor (or we may even replace it with an entirely different implementation);
use at your own risk.
