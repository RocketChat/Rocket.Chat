# Piwik Analytics Tracking

Rocket.Chat supports adding Piwik url and site id to track the analytics of your
server. Through this you will be able to see details analytics of per user,
including how many messages a session they send via custom events in Piwik and
how many channels they interact with.

## Piwik & Google Chrome
Google Chrome has a setting which sends a Do Not Track with each request and by
default Piwik respects that and you have to manually disable that feature inside
of Piwik. [Piwik has great documentation on how to disable this feature.](http://piwik.org/docs/privacy/#step-4-respect-donottrack-preference)

## Piwik Settings in Rocket.Chat
Settings -> Piwik

### General
* **URL**: The url where your piwik is located. This is used for generating the tracking code and is required. Recommended format is: `//rocketchat.piwikpro.com/`
* **Client ID**: The client id which this website is. This is a number without any decimals, example: `1`

### Features Enabled
* **Messages**: `true/false` determines whether to use custom events to track how many times a user does something with a message. This ranges from sending messages, editing messages, reacting to messages, pinning, starring, and etc.
* **Rooms**: `true/false` determines whether to use custom events to track how many times a user does actions related to a room (channel, direct message, group). This ranges from creating, leaving, archiving, renaming, and etc.
* **Users**: `true/false` determines whether to use custom events to track how many times a user does actions related to users. This ranges from resetting passwords, creating new users, updating profile pictures, etc.
