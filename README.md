<img src="http://rocket.chat/images/logo/logo-dark.svg?v2" />

The Complete Open Source Chat Solution

## Demo

Checkout the latest version at http://rocket.chat

## About

[![Code Climate][codeclimate-image]][codeclimate-url]
[![MIT License][license-image]][license-url]

Rocket.Chat is a Web Chat Server, developed in JavaScript, using the [Meteor](https://www.meteor.com/install) fullstack framework.

It is a great solution for communities and companies wanting to privately host their own chat service or for developers looking forward to build and evolve their own chat platforms.

### On the News

##### [Hacker News](https://news.ycombinator.com/item?id=9624737)
> Yes, we made it to the #1

##### [Product Hunt](http://www.producthunt.com/posts/rocket-chat)
> Your own open source Slack-like chat

##### [JavaScript Weekly](http://javascriptweekly.com/issues/234)
> An open source Web based, channel based chat system (a la Slack) built using Meteor, the full stack JavaScript development platform.

##### [wwwhatsnew.com](http://wwwhatsnew.com/2015/05/30/rocket-chat-para-los-programadores-que-quieran-ofrecer-un-chat-en-su-web/)
> Para los programadores que quieran ofrecer un chat en su web

##### [clasesdeperiodismo.com](http://www.clasesdeperiodismo.com/2015/05/30/un-chat-de-codigo-abierto-que-puedes-anadir-a-la-web/)
> Un chat de código abierto que puedes añadir a la web

## Installation

### Development

Prerequisites:

* [Git](http://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [Meteor](https://www.meteor.com/install)

Now just clone and start the app:

```sh
git clone https://github.com/RocketChat/Rocket.Chat.git
cd Rocket.Chat
meteor
```

### Production

#### Docker

[Official Docker Registry](https://registry.hub.docker.com/u/rocketchat/rocket.chat/)

```
docker pull rocketchat/rocket.chat
```

#### One-Click Deploy

##### Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)


## Features

### Current

- BYOS (bring your own server)
- Multiple Rooms
- Direct Messages
- Private Groups
- Public Channels
- Desktop Notifications
- Mentions
- Avatars
- Markdown
- Emojis
- Transcripts / History
- I18n - [Internationalization with Lingohub](https://translate.lingohub.com/engelgabriel/rocket-dot-chat/dashboard)
- Hubot Friendly - [Hubot Integration Project](https://github.com/RocketChat/hubot-rocketchat)
- Media Embeds - [Iframely Responsive Web Embeds](https://github.com/itteco/iframely)

### Roadmap for v1.0

- WebRTC signalling
- File uploads
- Full text search
- REST-like APIs
- Off-the-Record (OTR) Messaging
- LDAP / Kerberos Authentication
- XMPP Multi-user chat (MUC)
- Native Mobile App
- Native Desktop App

### Issues

[Github Issues](https://github.com/RocketChat/Rocket.Chat/issues) are used to track todos, bugs, feature requests, and more.

### Integrations

#### Hubot

The docker image is ready.
Everyone can start hacking the adapter code, or launch his/her own bot within a few minutes now.
Please head over to the [Hubot Integration Project](https://github.com/RocketChat/hubot-rocketchat) for more information.

#### Many, many, many more to come!

We are developing the APIs based on the competition, so stay tunned and you will see a lot happening here.

### Documentation

Checkout [Github Wiki](https://github.com/RocketChat/Rocket.Chat/wiki) (coming soon)

## Credits

Thanks to [Diego Sampaio](https://github.com/sampaiodiego), [Gabriel Engel](https://github.com/engelgabriel), [Marcelo Schmidt](https://github.com/marceloschmidt), [Rafael Caferati](https://github.com/rcaferati) e [Rodrigo Nascimento](https://github.com/rodrigok)

Emoji provided free by [Emoji One](http://emojione.com)

Performance monitoring provided by [Kadira](https://kadira.io/)

### Contributions

#### We Need Your Help!

A lot of work has already gone into Rocket.Chat, but we have much bigger plans for it!

So if you'd like to be part of the project, please check out the [roadmap](https://github.com/RocketChat/Rocket.Chat/milestones) and [issues](https://github.com/RocketChat/Rocket.Chat/issues) to see if there's anything you can help with.

### Translations

We are experimenting [Lingohub](https://translate.lingohub.com/engelgabriel/rocket-dot-chat/dashboard).
If you want to help, send an email to support at rocket.chat to be invited to the translation project.

### Community

Join the the conversation at [Twitter](http://twitter.com/RocketChatApp), [Facebook](https://www.facebook.com/RocketChatApp) or [Google Plus](https://plus.google.com/+RocketChatApp)

### License

Note that Rocket.Chat is distributed under the [MIT License](http://opensource.org/licenses/MIT).


[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE

[codeclimate-image]: https://codeclimate.com/github/RocketChat/Rocket.Chat/badges/gpa.svg
[codeclimate-url]: https://codeclimate.com/github/RocketChat/Rocket.Chat
