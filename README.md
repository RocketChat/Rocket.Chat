![Rocket.Chat logo](https://upload.wikimedia.org/wikipedia/commons/1/12/Rocket.Chat_Logo.svg)

### [Blockstack][bs] + [Rocket.Chat][rc] == [BlockParty][bp]

> The first open source community chat platform to implement fully decentralized
> user authentication.

BlockParty is a fork of [Rocket.Chat](https://rocket.chat).
The Ultimate Open Source Chat Platform - Now decentralized!

* [Community](#community)
* [Mobile Apps](#mobile-apps)
* [Desktop Apps](#desktop-apps)
* [Deployment](#deployment)
   * [Snaps](#instant-server-installation-with-snaps)
   * [RocketChatLauncher](#rocketchatlauncher)
   * [Layershift](#layershift)
   * [Sandstorm.io](#sandstormio)
   * [Yunohost.org](#yunohostorg)
   * [DPlatform](#dplatform)
   * [IndieHosters](#indiehosters)
   * [Ubuntu 16.04](#ubuntu-1604)
   * [Cloudron.io](#cloudronio)
   * [Heroku](#heroku)
   * [Helm Kubernetes](#helm-kubernetes)
  * [Scalingo](#scalingo)
  * [Sloppy.io](#sloppyio)
  * [Docker](#docker)
  * [Ansible](#ansible)
  * [Raspberry Pi 2](#raspberry-pi-2)
  * [Koozali SME](#koozali-sme)
  * [Ubuntu VPS](#ubuntu-vps)
  * [Hyper.sh](#hypersh)
  * [WeDeploy](#wedeploy)
  * [D2C.io](#d2cio)
* [About Rocket.Chat](#about-rocketchat)
  * [In the News](#in-the-news)
  * [Features](#features)
  * [Roadmap](#roadmap)
  * [How it all started](#how-it-all-started)
  * [Awards](#awards)
  * [Issues](#issues)
  * [Stack Overflow](#stack-overflow)
  * [Integrations](#integrations)
  * [Documentation](#documentation)
  * [License](#license)
* [Development](#development)
 * [Quick Start](#quick-start-for-code-developers)
  * [Branching Model](#branching-model)
  * [Translations](#translations)
  * [How to Contribute](#how-to-contribute)
* [Credits](#credits)
* [Donate](#donate)

### Why Rocket.Chat

BlockParty implements a custom authorisation process through Blockstack.
However, Rocket.Chat already has an ideal feature set for the Blockstack
community:

- Off The Record (OTR) message encryption (optional)
- MIT licence, can fork and run your own private instance
- Two-factor authentication (2FA)
- Embed real-time chat widgets
- Real-time translation
- Web, desktop and mobile
- Integrations, data importers and powerful APIs

[See here](https://github.com/aragon/governance/issues/7) for more on the
virtues of Rocket.Chat as a messaging app for the decentralised community.

### Usage and Docs

[See the Rocket.Chat master readme][readme] for information on modifying and
deploying. The descriptions below will only detail the variations on this fork,
as it relates to Blockstack and decentralization features.

### Demo already!

[BlockParty.chat](blockparty.chat) is the demo instance. The identity and design
is an example of how Rocket.Chat can be customised. When rolling your own
instance, there’s no requirement to retain branding or terms from Rocket.Chat
or BlockParty.

### Mobile Usage

**Rocket.Chat provides an optimised experience within mobile browsers.**

They also provide open source apps for devices, including Cordova apps wrapping
the web interface and native apps on both Android and iOS.

These apps can be forked to implement Blockstack auth with further development
and some collaboration with the Blockstack team, related to their [mobile
support roadmap](https://forum.blockstack.org/t/blockstack-mobile-plans/3621/6).

*Now compatible with all Android devices as old as version 4.0.x - [download here](https://rocket.chat/docs/developer-guides/mobile-apps/), even on BlackBerry Passport!*

This project was launched as an entry to Blockstack's 2018 Signature Bounty
to Decentralize Communication.

However, being an open source project it will continue to add features and
overall performance, stability and experience enhancements. As a direct fork of
Rocket.Chat it can stay in-sync with upstream releases, but also accept
contributions from the Blockstack community.

### Contributions

We recommend that for the time being, any issues be made to the original
Rocket.Chat repo, unless they specifically relate to authentication.

### What's the Diff

Rocket.Chat default behaviour has been modified to suit the decentralised
principles of Blockstack.

These settings are mostly applied in the `rocketchat-blockstack` package. In
principle it is intended to be used instead of, not along with, centralised
auth providers. However it would be possible to have Blockstack authentication
in any Rocket.Chat instance.

Most of the authentication logic is not unique to Rocket.Chat. It is an
objective of this project to streamline adaptation of the Rocket.Chat auth
provider into an all purpose Meteor auth provider, enabling any other Meteor
apps to decentralize accounts via Blockstack signin.

Find out more information about our snaps [here](https://rocket.chat/docs/installation/manual-installation/ubuntu/snaps/).

- Force SSL : true
- Allow Users to Delete Own Account : true
- Require Name for Signup : false

The password login is available for admins or to resolve Blockstack
authentication issues. Users can set their own password, but can only register
via the **Sign in with Blockstack** button.

### Roadmap

- Appoint community contribution and management team
- Forked iOS and Android apps specifically for BlockParty instances
- Full auth documentation and debug logging to encourage further contribution
- Repackage and publish as generic Meteor package `accounts-blockstack`
- Publish tutorial app for Blockstack auth in Meteor
- Use Blockstack file upload package for assets storage (similar to S3 package)
- How-to-fork and setup guides submitted to rocket.chat/docs
- Support other encryption protocols like OMEMO (conversations.im/omemo) #36
- Use Let’s Encrypt to automatically issue SSL certificates for instances
- Bot onboarding / welcome and integration with other Blockstack services

### Minor Issues

The following will be migrated into GitHub issues for further tracking...

- Optional popup instead of redirect to Blockstack login
- Switch back to official blockstack.js dependencies when PRs resolved
- Remove unuesd packages and settings for other auth/SSO providers
- Prevent uploading avatars, only link from Blockstack ID
- Fix all assumptions in code that users will have email address
- Add scopes to settings (not currently necessary)
- Pending login animations / button state / pause client processing etc
- Put all dependencies into meteor package, not app root package.json
- Cater for linking users with multiple or changed Blockstack IDs
- Set whitelisted fields (see `rocketchat-lib/server/oath/google.js`)

### Gotchas!

#### First User Admin

Unless you've set the environment vars to add default admin password, the first
user to access the site will become admin. Make sure it's you, before making
your instance public.

#### Password Logins

It's still possible for users to login via password, to aid in recovery from bad
settings that might break Blockstack authentication and would otherwise leave
users locked out. However, the registration process is removed so that users
must all be created with a Blockstack ID first, then can access their profile
to set a password. If the admin is created on build with environment variables,
they will always be able to enter by password and manually reset other user's
passwords.

#### User Emails

[![DP deploy](https://raw.githubusercontent.com/DFabric/DPlatform-ShellCore/images/logo.png)](https://dfabric.github.io/DPlatform-ShellCore)

#### Theming Your Instance

There's a `blockparty-theme` package that could be used as an example of how
BlockParty's visual customisations and default settings were achieved. Custom
CSS can also be set by admins and the Rocket.Chat documentation has a section
on theming your instance.

#### Security Note

User data in tokens is not verified on login currently. This may have security
implications and should be resolved with advice from the Blockstack community.

#### Offline Access

Offline access really hasn’t been considered beyond writing this note. An
approach might use RoutePolicy to process some user events offline, which can
probably be done safely without preventing access to offline accessible parts
of the app.

#### Performance

Rocket.Chat required `meteor-node-stubs` package to support the `crypto` module
in client. This is probably unnecessary if a smaller solution can be found to
work around this issue. The optimal approach would actually be refactoring the
Blockstack node modules as a Meteor package, thus reducing dependencies and
build complications.

#### Lil Hacks

Lastly, waiting for PR to be merged to use published packages instead forks.
- https://github.com/blockstack/blockstack.js/issues/308
- https://github.com/blockstack/jsontokens-js/pull/14

___

## Thanks!

To [@Sing-Li](https://github.com/Sing-Li) for promoting the bounty project,
being an awesome community advocate and pushing me to give it a shot!

[article]:https://www.rurri.com/articles/Creating-a-custom-authentication-service-in-Meteor.html
To [@rurri](https://https://github.com/rurri) for shedding light on the darker
corners of Meteor authentication processes - [in this article][article].


## Sloppy.io
Host your docker container at [sloppy.io](http://sloppy.io). Get an account and use the [quickstarter](https://github.com/sloppyio/quickstarters/tree/master/rocketchat).


## Docker
[Deploy with docker compose](https://rocket.chat/docs/installation/docker-containers/docker-compose/)

[![Rocket.Chat logo](https://d207aa93qlcgug.cloudfront.net/1.95.5.qa/img/nav/docker-logo-loggedout.png)](https://hub.docker.com/r/rocketchat/rocket.chat/)

OR Use the automated build image of our [most recent release](https://hub.docker.com/r/rocketchat/rocket.chat/)

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

## Ansible
Automated production-grade deployment in minutes, for RHEL / CentOS 7 or Ubuntu 14.04 LTS / 15.04.

[![Ansible deployment](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/ansible.png)](https://rocket.chat/docs/installation/automation-tools/ansible/)

## Raspberry Pi 2
Run Rocket.Chat on this world famous $30 quad core server.

[![Raspberry Pi 2](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/pitiny.png)](https://github.com/RocketChat/Rocket.Chat.RaspberryPi)

## Koozali SME

Add Rocket.Chat to this world famous time tested small enterprise server today.

[![Koozali SME](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/koozali.png)](https://wiki.contribs.org/Rocket_Chat)

## Ubuntu VPS
Follow these [deployment instructions](https://rocket.chat/docs/installation/manual-installation/ubuntu/).

## Hyper.sh
Follow their [deployment instructions](https://rocket.chat/docs/installation/paas-deployments/hyper-sh/) to install a per-second billed Rocket.Chat instance on [Hyper.sh](https://rocket.chat/docs/installation/paas-deployments/hyper-sh/).

## WeDeploy
Install Rocket.Chat on [WeDeploy](https://wedeploy.com):

[![Deploy](https://cdn.wedeploy.com/images/deploy.svg)](https://console.wedeploy.com/deploy?repo=https://github.com/wedeploy-examples/rocketchat-example)

## D2C.io
Deploy Rocket.Chat stack to your server with [D2C](https://d2c.io/). Scale with a single click, check live logs and metrics:

[![Deploy](https://github.com/mastappl/images/blob/master/deployTo.png)](https://panel.d2c.io/?import=https://github.com/d2cio/rocketchat-stack/archive/master.zip/)

# About Rocket.Chat

Rocket.Chat is a Web Chat Server, developed in JavaScript, using the [Meteor](https://www.meteor.com/install) fullstack framework.

It is a great solution for communities and companies wanting to privately host their own chat service or for developers looking forward to build and evolve their own chat platforms.

## In the News

##### [Wired](http://www.wired.com/2016/03/open-source-devs-racing-build-better-versions-slack/)
> Open Sourcers Race to Build Better Versions of Slack

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

- BYOS (Bring Your Own Server)
- Multiple Rooms
- Direct Messages
- Private Groups
- Public Channels
- Desktop Notifications
- Mentions
- Avatars
- Markdown
- Emojis
- Custom Emojis
- Reactions
- One touch Geolocation
- TeX Math Rendering - inline math typesetting
- Media Embeds
- Link Previews
- Sent Message Edit and Deletion
- Transcripts / History
- File Upload / Sharing
- Scalable file sharing - S3 uploads with CDN downloads
- Full text search
- Global search (from all channels/rooms at once)
- Live chat / Messaging call center
- LDAP Authentication
- CAS 1.0, 2.0 support for educational institutions and hosting providers worldwide
- Support for Okta SSO through SAML v2
- I18n - Supports 22 Languages
- Hubot Friendly
- (Beta) Face to Face Video Conferencing (aka WebRTC )
- (Beta) Multi-users Video Group Chat
- (Beta) Jitsi integration
- Audio calls
- Multi-users Audio Conference
- Screensharing
- Drupal 7.x and 8.x Plug-in (both stable and development flavours) ([download](https://www.drupal.org/project/rocket_chat)  and [source code](https://git.drupal.org/project/rocket_chat.git) )
- XMPP bridge ([try it](https://open.rocket.chat/channel/general))
- REST APIs
- Remote Video Monitoring
- Native real-time APIs for Microsoft C#, Visual Basic, F# and other .NET supported languages ([Get it!](https://www.nuget.org/packages/Rocket.Chat.Net/0.0.12-pre))
- API access from [Perl](https://metacpan.org/pod/Net::RocketChat) and [Java](https://github.com/baloise/rocket-chat-rest-client)  (community contributions)
- Chat-ops powered by Hubot: scalable horizontal app integration (early access)
- Massively scalable hosting and provisioning (beta testing now)
- Native Cross-Platform Desktop Application [Windows, macOS, or Linux](https://rocket.chat/)
- Mobile app for iPhone, iPad, and iPod touch [Download on App Store](https://geo.itunes.apple.com/us/app/rocket-chat/id1148741252?mt=8)
- Mobile app for Android phone, tablet, and TV stick [Available now on Google Play](https://play.google.com/store/apps/details?id=chat.rocket.android)
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
- WordPress Plug-in [Issue # 1920](https://github.com/RocketChat/Rocket.Chat/issues/1920)
- Integration with PSTN (Public Switched Telephone Networks)
- API-enabled methods: [Issue #202](https://github.com/RocketChat/Rocket.Chat/issues/202), [Issue #454](https://github.com/RocketChat/Rocket.Chat/issues/454), [Issue #455](https://github.com/RocketChat/Rocket.Chat/issues/455), [Issue #759](https://github.com/RocketChat/Rocket.Chat/issues/759)
- Scalable WebRTC broadcaster / media-server integration, [Issue #1118](https://github.com/RocketChat/Rocket.Chat/issues/1118)
- White label hosting
- Reseller support for white label hosting
- CRM integrations: Microsoft Dynamics CRM, Salesforce.com, Zoho.com, SugarCRM, SuiteCRM and more
- Support multiple teams on the same instance / same VPS infrastructure: [Issue #658](https://github.com/RocketChat/Rocket.Chat/issues/658), [Issue #630](https://github.com/RocketChat/Rocket.Chat/issues/630)

#### Planned
- Kerberos Authentication: [Issue #839](https://github.com/RocketChat/Rocket.Chat/issues/839)
- More webhooks: GitLab, Confluence, Jira, Piwik, WordPress: [Issue #233](https://github.com/RocketChat/Rocket.Chat/issues/233), [Issue #525](https://github.com/RocketChat/Rocket.Chat/issues/525), [Issue #637](https://github.com/RocketChat/Rocket.Chat/issues/637), [Issue #638](https://github.com/RocketChat/Rocket.Chat/issues/638), [Issue #747](https://github.com/RocketChat/Rocket.Chat/issues/747)
- Anonymous use of Rocket.Chat: [Issue #604](https://github.com/RocketChat/Rocket.Chat/issues/604)
- File Sharing via P2P: [Issue #369](https://github.com/RocketChat/Rocket.Chat/issues/369), [Issue #370](https://github.com/RocketChat/Rocket.Chat/issues/370)
- Anti-virus checking on file uploads: [Issue #757](https://github.com/RocketChat/Rocket.Chat/issues/757)

## How it all started

Read about [how it all started](https://blog.blackducksoftware.com/rocket-chat-enabling-privately-hosted-chat-services).

## Awards
[![InfoWorld Bossie Awards 2016 - Best Open Source Applications](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/bossie.png)](http://www.infoworld.com/article/3122000/open-source-tools/bossie-awards-2016-the-best-open-source-applications.html#slide4)

[![Black Duck Open Source Rookie of the Year for 2015](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/blackducksm.png)](https://info.blackducksoftware.com/OpenSourceRookies2015)

[![Softpedia 100% Free and Clean Award for 2017](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/softpedia.gif)](http://www.softpedia.com/get/Internet/Chat/Other-Chat-Tools/Rocket-Chat.shtml#status)

## Issues

[Github Issues](https://github.com/RocketChat/Rocket.Chat/issues) are used to track bugs and tasks on the roadmap.

## Feature Requests

[Feature Request Forums](https://forums.rocket.chat/c/feature-requests) are used to suggest, discuss and upvote feature suggestions.

### Stack Overflow

Please use the [Stack Overflow TAG](http://stackoverflow.com/questions/tagged/rocket.chat)

## Integrations

#### Hubot

The docker image is ready.
Everyone can start hacking the adapter code, or launch his/her own bot within a few minutes now.
Please head over to the [Hubot Integration Project](https://github.com/RocketChat/hubot-rocketchat) for more information.


#### Chat-ops integrations powered by Hubot

Integrate your application with fly-in panels today! Early access is available for developers.

![Sample integration of a Drones Fleet Management System](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/dronechatops.png)

#### Many, many, many more to come!

We are developing the APIs based on the competition, so stay tuned and you will see a lot happening here.

## Documentation

Checkout [Rocket.Chat documentation](https://rocket.chat/docs/).

## License

Note that Rocket.Chat is distributed under the [MIT License](http://opensource.org/licenses/MIT).

# Development

## Quick start for code developers
Prerequisites:

* [Git](http://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [Meteor](https://www.meteor.com/install)

> Meteor automatically installs a hidden [NodeJS v8](https://nodejs.org/download/release/v8.9.3/), [Python v2.7](https://www.python.org/downloads/release/python-270/) and [MongoDB v3.6](https://www.mongodb.com/mongodb-3.6) to be used when you run your app in development mode using the `meteor` command.

Now just clone and start the app:

```sh
git clone https://github.com/RocketChat/Rocket.Chat.git
cd Rocket.Chat
meteor npm start
```

If you are not a developer and just want to run the server - see [deployment methods](https://rocket.chat/docs/installation/paas-deployments/).

## Branching Model

See [Branches and Releases](https://rocket.chat/docs/developer-guides/branches-and-releases/).

It is based on [Gitflow Workflow](http://nvie.com/posts/a-successful-git-branching-model/), reference section below is derived from Vincent Driessen at nvie.

See also this [Git Workflows Comparison](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) for more details.

## Translations
We are experimenting [Lingohub](https://translate.lingohub.com/engelgabriel/rocket-dot-chat/dashboard).
If you want to help, send an email to support at rocket.chat to be invited to the translation project.

## How to Contribute

Already a JavaScript developer? Familiar with Meteor? [Pick an issue](https://github.com/RocketChat/Rocket.Chat/labels/contrib%3A%20easy), push a PR and instantly become a member of Rocket.Chat's international contributors community.

A lot of work has already gone into Rocket.Chat, but we have much bigger plans for it!

### Contributor License Agreement

Please review and sign our CLA at https://cla-assistant.io/RocketChat/Rocket.Chat

# Credits

Thanks to our core team
[Aaron Ogle](https://github.com/geekgonecrazy),
[Bradley Hilton](https://github.com/Graywolf336),
[Diego Sampaio](https://github.com/sampaiodiego),
[Gabriel Engel](https://github.com/engelgabriel),
[Marcelo Schmidt](https://github.com/marceloschmidt),
[Rodrigo Nascimento](https://github.com/rodrigok),
[Sing Li](https://github.com/Sing-Li),
and to hundreds of awesome [contributors](https://github.com/RocketChat/Rocket.Chat/graphs/contributors).

![Emoji One](https://cloud.githubusercontent.com/assets/1986378/24772858/47290a70-1ae9-11e7-9a5a-2913d0002c94.png)

Emoji provided free by [Emoji One](http://emojione.com)

![BrowserStack](https://cloud.githubusercontent.com/assets/1986378/24772879/57d57b88-1ae9-11e7-98b4-4af824b47933.png)

Testing with [BrowserStack](https://www.browserstack.com)



# Donate

Rocket.Chat will be free forever, but you can help us speed-up the development!

[![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=ZL94ZE6LGVUSN)

[![Bitcoins](https://github.com/RocketChat/Rocket.Chat.Docs/blob/master/1.%20Contributing/Donating/coinbase.png?raw=true)](https://www.coinbase.com/checkouts/ac2fa967efca7f6fc1201d46bdccb875)


[BountySource](https://www.bountysource.com/teams/rocketchat)
