import { Meteor } from 'meteor/meteor';

export const { getGlobalWindow } = Meteor.isServer ? require('../server/getGlobalWindow') : require('../client/getGlobalWindow');
