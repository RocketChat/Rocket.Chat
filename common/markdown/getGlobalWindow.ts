import { Meteor } from 'meteor/meteor';

export const { getGlobalWindow } = Meteor.isServer
	? require('../../server/utils/markdown/getGlobalWindow')
	: require('../../app/markdown/client/getGlobalWindow');
