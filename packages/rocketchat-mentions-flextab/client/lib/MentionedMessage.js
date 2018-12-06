import { Mongo } from 'meteor/mongo';

export const MentionedMessage = new Mongo.Collection('rocketchat_mentioned_message');
