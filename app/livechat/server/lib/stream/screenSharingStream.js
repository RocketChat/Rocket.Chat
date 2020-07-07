import { Meteor } from 'meteor/meteor';

export const screenSharingStreamer = new Meteor.Streamer('screen-sharing');
screenSharingStreamer.allowRead('all');
screenSharingStreamer.allowEmit('all');
screenSharingStreamer.allowWrite('all');
