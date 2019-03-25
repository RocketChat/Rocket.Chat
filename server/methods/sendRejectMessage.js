import { Meteor } from 'meteor/meteor';
import { Rooms, Messages } from '../../app/models';
import { TAPi18n } from 'meteor/tap:i18n';
import { callbacks } from '../../app/callbacks';

Meteor.methods({
	'jitsi:rejectCall': (rid, type = 'jitsi_call_rejected') => {

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'jitsi:rejectCall' });
		}

		const message = Messages.createWithTypeRoomIdMessageAndUser(type, rid, '', Meteor.user());
		const room = Rooms.findOneById(rid);
		switch (type) {
			case 'jitsi_call_rejected':
				message.msg = TAPi18n.__('Rejected_a_video_call');
				break;
			case 'jitsi_call_finished_creator':
				message.msg = TAPi18n.__('Finished_a_video_call_creator');
				break;
		}
		message.mentions = [
			{
				_id: 'here',
				username: 'here',
			},
		];
		callbacks.run('afterSaveMessage', message, room);
	},
});
