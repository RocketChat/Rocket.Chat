import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { Rooms, Messages } from '../../../models';
import { callbacks } from '../../../callbacks';

Meteor.methods({
	'jitsi:updateTimeout': (rid) => {

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'jitsi:updateTimeout' });
		}

		const room = Rooms.findOneById(rid);
		const currentTime = new Date().getTime();

		const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();

		if (jitsiTimeout <= currentTime) {
			Rooms.setJitsiTimeout(rid, new Date(currentTime + 35 * 1000));
			const message = Messages.createWithTypeRoomIdMessageAndUser('jitsi_call_started', rid, '', Meteor.user(), {
				actionLinks : [
					{ icon: 'icon-videocam', label: TAPi18n.__('Click_to_join'), method_id: 'joinJitsiCall', params: '' },
				],
			});
			const room = Rooms.findOneById(rid);
			message.msg = TAPi18n.__('Started_a_video_call');
			message.mentions = [
				{
					_id:'here',
					username:'here',
				},
			];
			callbacks.run('afterSaveMessage', message, room);
		} else if ((jitsiTimeout - currentTime) / 1000 <= 15) {
			Rooms.setJitsiTimeout(rid, new Date(jitsiTimeout + 25 * 1000));
		}
	},
});
