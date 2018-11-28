import { Mongo } from 'meteor/mongo';

export const UsersSessions = new Mongo.Collection('usersSessions2');

export const UsersSessionsRaw = UsersSessions.rawCollection();
