import { Meteor } from 'meteor/meteor';

import { Users } from '../../app/models';

Meteor.methods({
	checkIfDirectMessageRecipientIsBot(rid) {
		const ridArray = rid.split(Meteor.userId());
		let potentialBotUserId;

		if (ridArray[0] === '') {
			potentialBotUserId = ridArray[1];
		} else {
			potentialBotUserId = ridArray[0];
		}

		const user = Users.findOne({ _id: potentialBotUserId });

		if (user) {
			const userRoles = user.roles;
			if (userRoles.includes('bot') || userRoles.includes('livechat-agent')) {
				return true;
			}

			return false;
		}

		return false;
	},
});
