[bs]:https://blockstack.org
[rc]:https://rocket.chat
[bp]:https://amazebot.github.io/blockparty
[e2e]:https://github.com/Amazebot/BlockParty/tree/end-to-end-encryption
[master]:https://github.com/Amazebot/BlockParty/tree/master
[readme]:https://github.com/RocketChat/Rocket.Chat/blob/master/README.md

### [Blockstack][bs] + [Rocket.Chat][rc] == [BlockParty][bp]

> The first open source community chat platform to implement fully decentralized
> user authentication.

BlockParty is a fork of [Rocket.Chat](https://rocket.chat).
The Ultimate Open Source Chat Platform - Now decentralized!

There’s two release branches available*
- [**master**][master] based off Rocket.Chat releases
- [**end-to-end-encryption**][e2e] an experimental feature branch

\*Other branches are simply part of the Rocket.Chat fork but do have
  Blockstack integration.

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
as it relates to Blockstack and decentralisation features.

### Demo already!

[BlockParty.chat](blockparty.chat) is the demo instance. The identity and design
is an example of how Rocket.Chat can be customised. When rolling your own
instance, there’s no requirement to retain branding or terms from Rocket.Chat
or BlockParty.

The existinng [**mobile apps**](https://rocket.chat/download) can be used with
any Rocket.Chat server, including your own instances. Just enter the server
address on startup, e.g. `blockparty.chat`.

___

## Ongoing Development

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

Some configuration defaults have also been changed to be fit for purpose:

- Force SSL : true
- Allow Users to Delete Own Account : true
- Resize Avatars : false (uses only URL for Blockstack asset)
- Require Name for Signup : false
- Require Password Confirmation : false (only Blockstack auth)
- Password Reset : false (as above)
- Internal Hubot > Username : block.bot

### Roadmap

- Appoint community contribution and management team
- Forked iOS and Android apps specifically for BlockParty instances
- Full documentation and debug logging to encourage further contribution
- Repackage and publish as generic Meteor package `accounts-blockstack`
- Publish tutorial app for Blockstack auth in Meteor
- Use Let’s Encrypt to automatically issue SSL certificates for instances
- Use Blockstack file upload package for assets storage (similar to S3 package)
- Use Blockstack for Mongo storage to decentralize DB
- How-to-fork and setup guides submitted to rocket.chat/docs
- Secure and serve BlockParty as decentralized app
- Support other encryption protocols like OMEMO (conversations.im/omemo) #36
- Bot onboarding / welcome and integration with other Blockstack services

### Minor Issues

The following will be migrated into GitHub issues for further tracking...

- Optional popup instead of redirect to Blockstack login
- Switch back to official blockstack.js dependencies when PRs resolved
- Remove unuesd packages and settings for other auth/SSO providers
- Prevent uploading avatars, only link from Blockstack ID
- Fix all assumptions in code that user's will have email address
- Add scopes to settings (not currently necessary)
- Pending login animations / button state / pause client processing etc
- Put all dependencies into meteor package, not app root package.json
- Cater for linking users with multiple or changed Blockstack IDs
- Set whitelisted fields (see `rocketchat-lib/server/oath/google.js`)

### Gotchas!

#### First User Admin

Unless you've the environment vars to set a default admin password, the first
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

Rocket.Chat users require email, due to a number of tightly coupled methods
that were not written with emails as a conditional field. This needs some quick
fixes on this fork, but also a longer term approach to incorporate into
Rocket.Chat as a core design principle, to allow future integrations of upstream
changes without creating more bugs by assuming existence of user emails.

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
Blockstack node modules as Meteor packages, thus reducing dependencies and
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

To [@amycleary](https://github.com/amycleary) for putting up with my late night
tapping and general dissociation while working on this (ok, all the time).
