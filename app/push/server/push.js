import { Match } from 'meteor/check';
import { Mongo } from 'meteor/mongo';

export const _matchToken = Match.OneOf({ apn: String }, { gcm: String });
export const notificationsCollection = new Mongo.Collection('_raix_push_notifications');
export const appTokensCollection = new Mongo.Collection('_raix_push_app_tokens');
appTokensCollection._ensureIndex({ userId: 1 });
