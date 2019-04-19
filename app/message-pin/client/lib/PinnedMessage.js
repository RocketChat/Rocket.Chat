import { Mongo } from 'meteor/mongo';

export const PinnedMessage = new Mongo.Collection('rocketchat_pinned_message');
