import { Mongo } from 'meteor/mongo';

export const SnippetedMessages = new Mongo.Collection('rocketchat_snippeted_message');
