import { Mongo } from 'meteor/mongo';

export const ChatIntegrations = new Mongo.Collection('rocketchat_integrations');
export const ChatIntegrationHistory = new Mongo.Collection('rocketchat_integration_history');
