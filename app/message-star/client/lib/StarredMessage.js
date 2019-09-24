import { Mongo } from 'meteor/mongo';

export const StarredMessage = new Mongo.Collection('rocketchat_starred_message');
