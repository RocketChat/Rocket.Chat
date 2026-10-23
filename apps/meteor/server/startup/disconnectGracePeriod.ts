import { Meteor } from 'meteor/meteor';

// Meteor 3.5 keeps a dropped DDP session for 15s, so users would stay online that long after closing the browser.
Meteor.server.options.disconnectGracePeriod = 0;
