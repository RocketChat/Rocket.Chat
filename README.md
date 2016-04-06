![Rocket.Chat logo](https://rocket.chat/images/logo/logo-dark.svg?v3)

# The Ultimate Open Source WebChat Platform

[![Rocket.Chat](https://demo.rocket.chat/images/join-chat.svg)](https://demo.rocket.chat/)
[![Build Status](https://img.shields.io/travis/RocketChat/Rocket.Chat/master.svg)](https://travis-ci.org/RocketChat/Rocket.Chat)
[![Coverage Status](https://coveralls.io/repos/RocketChat/Rocket.Chat/badge.svg)](https://coveralls.io/r/RocketChat/Rocket.Chat)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/8580571ba024426d9649e9ab389bd5dd)](https://www.codacy.com/app/RocketChat/Rocket-Chat)
[![Code Climate](https://codeclimate.com/github/RocketChat/Rocket.Chat/badges/gpa.svg)](https://codeclimate.com/github/RocketChat/Rocket.Chat)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/RocketChat/Rocket.Chat/raw/master/LICENSE)


* [Live Demo](#live-demo)
* [Mobile apps](#mobile-apps)
* [Desktop apps](#desktop-apps)
* [Deployment](#deployment)
   * [Sandstorm.io](#sandstormio) 
   * [DPlatform](#dplatform) 
   * [IndieHosters](#indiehosters)
   * [Cloudron.io](#cloudronio) 
   * [Nitrous.io](#nitrousio)
   * [Heroku](#heroku)
  * [Scalingo](#scalingo)
  * [Sloppy.io](#sloppyio)
  * [Docker](#docker)
  * [FreeBSD](#freebsd)
  * [Ansible](#ansible)
  * [Raspberry Pi 2](#raspberry-pi-2)
  * [Ubuntu VPS](#ubuntu-vps)
  * [Ubuntu Software Center](#ubuntu-software-center)
* [About Rocket.Chat](#about-rocketchat)
  * [On the News](#on-the-news)
  * [Features](#features)
  * [Roadmap](#roadmap)
  * [Issues](#issues)
  * [Integrations](#integrations)
  * [Documentation](#documentation)
  * [License](#license)
* [Development](#development)
 * [Quick Start](#quick-start-for-code-developers)
  * [Branching Model](#branching-model)
  * [Translations](#translations)
  * [Community](#community)
  * [How to Contribute](#how-to-contribute)
* [Credits](#credits)
* [Donate](#donate)


# Live Demo
Checkout the latest version at [https://demo.rocket.chat](https://demo.rocket.chat)


# Desktop Apps
Download the Native Cross-Platform Desktop Application at [Rocket.Chat.Electron](https://github.com/RocketChat/Rocket.Chat.Electron/releases)


# Mobile Apps
### Available from the AppStore
[![Rocket.Chat on Apple AppStore](http://linkmaker.itunes.apple.com/images/badges/en-us/badge_appstore-lrg.svg)](https://itunes.apple.com/us/app/rocket.chat/id1028869439?mt=8)

### Available from Google Play
[![Rocket.Chat on Google Play](https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Google_Play_logo_2015.PNG/220px-Google_Play_logo_2015.PNG)](https://play.google.com/store/apps/details?id=com.konecty.rocket.chat)

Now compatible with all Android devices as old as version 4.0.x - [download here](https://github.com/RocketChat/Rocket.Chat/wiki/Build-the-Android-Cordova-Web-App-and-connect-to-your-own-Rocket.Chat-Server), even on BlackBerry Passport!

### Also available as FirefoxOS app
[![Firefox OS app now available](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/firefoxos.png)](https://github.com/RocketChat/Rocket.Chat/wiki/Native-Firefox-OS-app-%28hosted-webapp%29)


# Deployment

## Sandstorm.io
Host your own Rocket.Chat server in four seconds flat:

[![Rocket.Chat on Sandstorm.io](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/sandstorm.jpg)](https://apps.sandstorm.io/app/vfnwptfn02ty21w715snyyczw0nqxkv3jvawcah10c6z7hj1hnu0)

_*Grab*_ the [Sandstorm SPK for the latest Rocket.Chat release](https://rocket.chat/releases/latest/spk) for testing on your own server.

## DPlatform

Easiest way to install a ready-to-run Rocket.Chat server on a Linux machine, VM, or VPS - [@j8r's   DPlatform](https://github.com/j8r/DPlatform), now in Alpha! 

[![deploy](https://raw.githubusercontent.com/j8r/DPlatform/gh-pages/img/deploy.png)](https://j8r.github.io/DPlatform/)

## IndieHosters
Get your Rocket.Chat instance hosted in a "as a Service" style. You register and we manage it for you! (updates, backup...)

[![Rocket.Chat on IndieHosters](https://indie.host/signup.png)](https://indiehosters.net/shop/product/rocket-chat-21)

## Cloudron.io

Install Rocket.Chat on [Cloudron](https://cloudron.io) Smartserver:

[![Install](https://cloudron.io/img/button.svg)](https://cloudron.io/button.html?app=chat.rocket.cloudronapp)

## Nitrous.io
**Free** development environment for Rocket.Chat in the cloud on [Nitrous.io](https://www.nitrous.io):

<a href="https://www.nitrous.io/quickstart">
  <img src="https://nitrous-image-icons.s3.amazonaws.com/quickstart.png" alt="Nitrous Quickstart" width=142 height=34>
</a>

## Heroku
Host your own Rocket.Chat server for **FREE** with [One-Click Deploy](https://heroku.com/deploy)

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/RocketChat/Rocket.Chat/tree/develop)

## Scalingo
Deploy your own Rocket.Chat server instantly on [Scalingo](https://scalingo.com)

[![Deploy on Scalingo](https://cdn.scalingo.com/deploy/button.svg)](https://my.scalingo.com/deploy?source=https://github.com/RocketChat/Rocket.Chat#develop)


## Sloppy.io
Host your docker container at [sloppy.io](http://sloppy.io). Get an account and use the [quickstarter](https://github.com/sloppyio/quickstarters/tree/master/rocketchat)


## Docker
[Deploy with docker compose](https://github.com/RocketChat/Rocket.Chat/wiki/Deploy-with-Docker)

or

Use the automated build image of our [most recent release](https://hub.docker.com/r/rocketchat/rocket.chat/)

[![Rocket.Chat logo](https://d207aa93qlcgug.cloudfront.net/1.95.5.qa/img/nav/docker-logo-loggedout.png)](https://hub.docker.com/r/rocketchat/rocket.chat/)

```
docker pull rocketchat/rocket.chat:latest
```

OR select a specific release ([details of releases available](https://github.com/RocketChat/Rocket.Chat/releases)):
```
docker pull rocketchat/rocket.chat:vX.X.X
```

OR our [official docker registry image](https://hub.docker.com/_/rocket.chat/), containing recent stable release build approved by Docker:

```
docker pull rocket.chat
```

## FreeBSD
Run solid five-nines deployment on industry workhorse FreeBSD server:

[![FreeBSD Daemon](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/freebsd.png)](https://github.com/RocketChat/Rocket.Chat/wiki/FreeBSD)

## Ansible
Automated production-grade deployment in minutes, for RHEL / CentOS 7 or Ubuntu 14.04 LTS / 15.04:

[![Ansible deployment](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/ansible.png)](https://github.com/RocketChat/Rocket.Chat/wiki/Easy,-hands-off-deployment-with-Ansible)

## Raspberry Pi 2
Run Rocket.Chat on this world famous $30 quad core server:

[![Raspberry Pi 2](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/pitiny.png)](https://github.com/RocketChat/Rocket.Chat.RaspberryPi)

## Ubuntu VPS
Follow these [deployment instructions](https://github.com/RocketChat/Rocket.Chat/wiki/Deploy-Rocket.Chat-without-docker)

## Ubuntu Software Center
Easy one click install right from your Ubuntu Desktop (coming soon)

[![Ubuntu Software Center](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/ubuntusoft.png)]()

# About Rocket.Chat

Rocket.Chat is a Web Chat Server, developed in JavaScript, using the [Meteor](https://www.meteor.com/install) fullstack framework.

It is a great solution for communities and companies wanting to privately host their own chat service or for developers looking forward to build and evolve their own chat platforms.

## On the News

##### [Hacker News](https://news.ycombinator.com/item?id=9624737)
> Yes, we made it to the #1

##### [Product Hunt](https://www.producthunt.com/tech/rocket-chat)
> Your own open source Slack-like chat

##### [JavaScript Weekly](http://javascriptweekly.com/issues/234)
> An open source Web based, channel based chat system (a la Slack) built using Meteor, the full stack JavaScript development platform.

##### [Open Source China](http://www.oschina.net/p/rocket-chat)
> Rocket.Chat 是特性最丰富的 Slack 开源替代品之一。 主要功能：群组聊天，直接通信，私聊群，桌面通知，媒体嵌入，链接预览，文件上传，语音/视频 聊天，截图等等。

##### [wwwhatsnew.com](http://wwwhatsnew.com/2015/05/30/rocket-chat-para-los-programadores-que-quieran-ofrecer-un-chat-en-su-web/)
> Para los programadores que quieran ofrecer un chat en su web

##### [clasesdeperiodismo.com](http://www.clasesdeperiodismo.com/2015/05/30/un-chat-de-codigo-abierto-que-puedes-anadir-a-la-web/)
> Un chat de código abierto que puedes añadir a la web

##### [snowulf.com](https://snowulf.com/2015/09/25/why-slack-when-you-can-rocket-chat/)
> Why Slack when you can Rocket.chat?

##### [liminality.xyz](http://liminality.xyz/self-hosting/)
> Self-hosted alternatives to popular cloud services


## Features

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
- Reactions
- TeX Math Rendering - inline math typesetting
- Media Embeds
- Link Previews
- Sent Message Edit and Deletion
- Transcripts / History
- File Upload / Sharing
- Scalable file sharing - S3 uploads with CDN downloads
- Full text search
- Live chat / Messaging call center
- LDAP Authentication
- CAS 1.0 support for education institutions and hosting providers worldwide
- Support for Okta SSO through SAML v2
- I18n - Supports 22 Languages
- Hubot Friendly
- Face to Face Video Conferencing (aka WebRTC)
- Multi-users Video Group Chat
- Audio calls
- Multi-users Audio Conference
- Screensharing
- XMPP bridge ([try it](https://demo.rocket.chat/channel/xmppbridge))
- REST APIs
- Remote Locations Video Monitoring
- Native real-time APIs for Microsoft C#, Visual Basic, F# and other .NET supported languages ([Get it!](https://www.nuget.org/packages/Rocket.Chat.Net/0.0.12-pre))
- Chat-ops powered by Hubot: scalable horizontal app integration (early access)
- Massively scalable hosting and provisioning (beta testing now)
- Native Cross-Platform Desktop Application [Windows, Mac OSX, or Linux](https://rocket.chat/)
- Mobile app for iPhone, iPad, and iPod touch [Download on AppStore!](https://geo.itunes.apple.com/us/app/rocket.chat/id1028869439?mt=8)
- Mobile app for Android phone, tablet, and TV stick [Available now on Google Play!](https://play.google.com/store/apps/details?id=com.konecty.rocket.chat)
- Native Firefox OS Application (also for Desktop Firefox and Firefox for Android!) - [Check the wiki page for install instructions](https://github.com/RocketChat/Rocket.Chat/wiki/Native-Firefox-OS-app-%28hosted-webapp%29)
- Sandstorm.io instant Rocket.Chat server [Now on Sandstorm App Store](https://apps.sandstorm.io/app/vfnwptfn02ty21w715snyyczw0nqxkv3jvawcah10c6z7hj1hnu0)
- Available on [Cloudron Store](https://cloudron.io/appstore.html#chat.rocket.cloudronapp)

## Roadmap

#### In Progress
- XMPP Support via [Webhook bridge](https://github.com/saqura/xmppwb) [Issue #404](https://github.com/RocketChat/Rocket.Chat/issues/404)
- Federation via [matrix.org](https://www.matrix.org/), see [hubot-freddie](https://www.npmjs.com/package/hubot-freddie) and [Federation project](https://github.com/RocketChat/Rocket.Chat.Federation) : [Issue #520](https://github.com/RocketChat/Rocket.Chat/issues/520), [Issue #601](https://github.com/RocketChat/Rocket.Chat/issues/601)
- Support for PostgreSQL: [Issue #533](https://github.com/RocketChat/Rocket.Chat/issues/533), [Issue #822](https://github.com/RocketChat/Rocket.Chat/pull/822)
- Native iOS Application [Issue #270](https://github.com/RocketChat/Rocket.Chat/issues/270), [Rocket.Chat.iOS - HELP WANTED](https://github.com/RocketChat/Rocket.Chat.iOS)
- Native Android Application [Issue #271 - HELP WANTED](https://github.com/RocketChat/Rocket.Chat/issues/271)
- Off the Record Messaging [Issue #36](https://github.com/RocketChat/Rocket.Chat/issues/36), [Issue #268](https://github.com/RocketChat/Rocket.Chat/issues/268)
- Wordpress Plug-in  [Issue # 1920](https://github.com/RocketChat/Rocket.Chat/issues/1920)
- Drupal Plug-in [Issue # 1921](https://github.com/RocketChat/Rocket.Chat/issues/1921)
- Integration with PSTN (telephone networks)
- API-enabled methods: [Issue #202](https://github.com/RocketChat/Rocket.Chat/issues/202), [Issue #454](https://github.com/RocketChat/Rocket.Chat/issues/454), [Issue #455](https://github.com/RocketChat/Rocket.Chat/issues/455), [Issue #759](https://github.com/RocketChat/Rocket.Chat/issues/759)
- Scalable WebRTC broadcaster / media-server integration, [Issue #1118](https://github.com/RocketChat/Rocket.Chat/issues/1118)
- White label hosting
- Reseller support for white label hosting
- CRM integrations: Microsoft Dynamics CRM,  Salesforce.com, Zoho.com, SugarCRM, SuiteCRM and more
- Support multiple teams on the same instance / same VPS infrastructure: [Issue #658](https://github.com/RocketChat/Rocket.Chat/issues/658), [Issue #630](https://github.com/RocketChat/Rocket.Chat/issues/630)

#### Planned
- Kerberos Authentication: [Issue #839](https://github.com/RocketChat/Rocket.Chat/issues/839)
- More webhooks: GitLab, Confluence, Jira, Piwik, Wordpress: [Issue #233](https://github.com/RocketChat/Rocket.Chat/issues/233), [Issue #525](https://github.com/RocketChat/Rocket.Chat/issues/525), [Issue #637](https://github.com/RocketChat/Rocket.Chat/issues/637), [Issue #638](https://github.com/RocketChat/Rocket.Chat/issues/638), [Issue #747](https://github.com/RocketChat/Rocket.Chat/issues/747)
- Anonymous use of Rocket.Chat: [Issue #604](https://github.com/RocketChat/Rocket.Chat/issues/604)
- File Sharing via P2P: [Issue #369](https://github.com/RocketChat/Rocket.Chat/issues/369), [Issue #370](https://github.com/RocketChat/Rocket.Chat/issues/370)
- Anti-virus checking on file uploads: [Issue #757](https://github.com/RocketChat/Rocket.Chat/issues/757)

## Awards

[![Black Duck Open Source Rookie of the Year](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/blackducksm.png)](https://www2.blackducksoftware.com/news/releases/black-duck-announces-open-source-rookies-of-the-year)

## Issues

[Github Issues](https://github.com/RocketChat/Rocket.Chat/issues) are used to track todos, bugs, feature requests, and more.

## Integrations

#### Hubot

The docker image is ready.
Everyone can start hacking the adapter code, or launch his/her own bot within a few minutes now.
Please head over to the [Hubot Integration Project](https://github.com/RocketChat/hubot-rocketchat) for more information.


#### Chat-ops integrations powered by Hubot

Integrate your application with fly-in panels today!   Early access is available for developers.

![Sample integration of a Drones Fleet Management System](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/dronechatops.png)

#### Many, many, many more to come!

We are developing the APIs based on the competition, so stay tuned and you will see a lot happening here.

## Documentation

Checkout [Github Wiki](https://github.com/RocketChat/Rocket.Chat/wiki)

## License

Note that Rocket.Chat is distributed under the [MIT License](http://opensource.org/licenses/MIT).


# Development

## Quick start for code developers
Prerequisites:

* [Git](http://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [Meteor](https://www.meteor.com/install)

Now just clone and start the app:

```sh
git clone https://github.com/RocketChat/Rocket.Chat.git
cd Rocket.Chat
meteor
```

If you are not a developer and just want to run the server - see [deployment methods](https://github.com/RocketChat/Rocket.Chat/wiki#deployment).

## Branching Model

See [Branches and Releases](https://github.com/RocketChat/Rocket.Chat/wiki/Branches-and-Releases).

It is based on [Gitflow Workflow](http://nvie.com/posts/a-successful-git-branching-model/), reference section below is derived from Vincent Driessen at nvie.

See also this [Git Workflows Comparison](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) for more details.

## Translations
We are experimenting [Lingohub](https://translate.lingohub.com/engelgabriel/rocket-dot-chat/dashboard).
If you want to help, send an email to support at rocket.chat to be invited to the translation project.

## Community

Join thousands of members  world-wide 24 x 7 in our [community server](https://demo.rocket.chat).  Join the conversation at [Twitter](https://twitter.com/RocketChatApp), [Facebook](https://www.facebook.com/RocketChatApp) or [Google Plus](https://plus.google.com/+RocketChatApp)

## How to Contribute

Already a JavaScript developer?  Familiar with Meteor?  [Pick an issue](https://github.com/RocketChat/Rocket.Chat/labels/contrib%3A%20easy), push a PR and instantly become a member of Rocket.Chat's international contributors community.

A lot of work has already gone into Rocket.Chat, but we have much bigger plans for it!


# Credits

Thanks to
[Aaron Ogle](https://github.com/geekgonecrazy),
[Bradley Hilton](https://github.com/Graywolf336),
[Diego Sampaio](https://github.com/sampaiodiego),
[Gabriel Engel](https://github.com/engelgabriel),
[Marcelo Schmidt](https://github.com/marceloschmidt),
[Rafael Caferati](https://github.com/rcaferati),
[Rodrigo Nascimento](https://github.com/rodrigok),
[Sing Li](https://github.com/Sing-Li),
and many others.

Emoji provided free by [Emoji One](http://emojione.com)

Performance monitoring provided by [Kadira](https://kadira.io)

Hosting powered by [Rackspace](https://rackspace.com)

# Donate

Rocket.Chat will be free forever, but you can help us speed-up the development!

[![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=49QX7TYCVZK8L)

[BountySource](https://www.bountysource.com/teams/rocketchat)
