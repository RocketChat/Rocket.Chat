import { Mongo } from 'meteor/mongo';

this.PinnedMessage = new Mongo.Collection('rocketchat_pinned_message');
