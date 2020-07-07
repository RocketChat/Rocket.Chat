import { Meteor } from 'meteor/meteor';

export const screenSharingStreamer = new Meteor.Streamer('screenhsaring');
screenSharingStreamer.allowRead('all');
screenSharingStreamer.allowEmit('all');
screenSharingStreamer.allowWrite('all');
