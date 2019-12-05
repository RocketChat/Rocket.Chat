import { Meteor } from 'meteor/meteor';

const webdavStreamer = new Meteor.Streamer('webdavAccounts');
webdavStreamer.allowWrite('none');
webdavStreamer.allowRead('logged');

export {
	webdavStreamer,
};
