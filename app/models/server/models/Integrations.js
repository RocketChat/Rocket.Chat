import { Meteor } from 'meteor/meteor';
import { Base } from './_Base';

export class Integrations extends Base {
	constructor() {
		super('integrations');
	}

	findByType(type, options) {
		if (type !== 'webhook-incoming' && type !== 'webhook-outgoing') {
			throw new Meteor.Error('invalid-type-to-find');
		}

		return this.find({ type }, options);
	}

	disableByUserId(userId) {
		return this.update({ userId }, { $set: { enabled: false } }, { multi: true });
	}

	updateRoomName(oldRoomName, newRoomName) {
		const hashedOldRoomName = `#${ oldRoomName }`;
		const hashedNewRoomName = `#${ newRoomName }`;
		const changedNumber = Integrations.update({ channel: hashedOldRoomName }, { $set: { 'channel.$': hashedNewRoomName } }, { multi: true });
		return changedNumber;
	}
}

export default new Integrations();
