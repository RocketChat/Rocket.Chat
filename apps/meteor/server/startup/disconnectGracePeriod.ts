import { Meteor } from 'meteor/meteor';

// Turns off DDP session resumption (Meteor 3.5+), so a session ends when its socket closes, as in microservices.
Meteor.server.options.disconnectGracePeriod = 0;
