##IRC Package for Rocket.Chat

### Overview

Internet Relay Chat (IRC) is a text-based group communication tool. Users join uniquely named channels, or rooms, for open discussion. IRC also supports private messages between individual users and file sharing capabilities. This package integrates these layers of functionality with Rocket.Chat.

This package does not attempt to replace Rocket.Chat functionality nor operate as an IRC server for third-party client support. Rather, it utilizes Slack's similarities to IRC by allowing users to transparently access external IRC servers (e.g. Freenode) through Rocket.Chat's desktop and mobile app frontends.


### Development

Core functionality is still in its infancy and needs improvement! If your objectives are broader than the stated scope of this project, please consider creating a separate package. Bugs and feature requests should be reported at [github.com/RocketChat/Rocket.Chat/issues](https://github.com/RocketChat/Rocket.Chat/issues)

The most active conversation on this package can be found in [Issue 216](https://github.com/RocketChat/Rocket.Chat/issues/216).


### Build Notes

It is strongly encouraged to not enable this package in a production environment. There is currently no strict user account oversight, meaning problematic interoperation with an IRC server may interfere with Rocket.Chat's authentication and room behavior. 

These *nix build notes are provided for development purposes only and do not include instructions on using SSL for encrypted authentication.  Additionally, the following must be installed:

* [Node.js](http://nodejs.org)
* [Meteor](http://www.meteor.com)
* [mongoDB](http://www.mongodb.com)

#### Clone the Rocket.Chat repo via Git

	git clone https://github.com/RocketChat/Rocket.Chat.git

#### Edit the package list

Change to the top-level directory of your Rocket.Chat repo. Edit .meteor/packages and uncomment the following:

	#rocketchat:irc

#### Export your environment variables
Modify as necessary.

	export ROOT_URL=http://localhost
	export MONGO_URL=mongodb://localhost:27017/rocketchat
	export PORT=3000

#### Compile the development environment

	meteor

Once all dependencies are met and the compile has completed successfully, you can access your Rocket.Chat build via http://localhost:3000

You will then need to create a new account, go into the admin settings, choose IRC, enable it, and restart Rocket.Chat. This complexity will decrease once the original codebase is retooled. 

As you use Rocket.Chat, be sure to monitor the console terminal (or Rocket.Chat's web admin log) for IRC errors and activity.


### Changelog

Please see the [commit history](https://github.com/RocketChat/Rocket.Chat/commits/develop/packages/rocketchat-irc) on GitHub for a full list of changes.

Major functional changes:

#### 0.0.2

* Remapped IRC username and real name to match Rocket.Chat's user accounts
* Added base support for config via web
* Performed package housecleaning for future growth

#### 0.0.1
 
  * Core concept, design, and functionality
