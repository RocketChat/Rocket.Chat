import { Meteor } from 'meteor/meteor';

import { API } from '../api';
import { findOrCreateInvite } from '../../../invites/server/functions/findOrCreateInvite';
import { listInvites } from '../../../invites/server/functions/listInvites';
import { useInviteToken } from '../../../invites/server/functions/useInviteToken';
import { validateInviteToken } from '../../../invites/server/functions/validateInviteToken';

API.v1.addRoute('listInvites', { authRequired: true }, {
	get() {
		let result;
		Meteor.runAsUser(this.userId, () => {
			result = listInvites(this.userId);
		});

		return API.v1.success(result);
	},
});

API.v1.addRoute('findOrCreateInvite', { authRequired: true }, {
	post() {
		const { rid, days, maxUses } = this.bodyParams;

		let result;
		Meteor.runAsUser(this.userId, () => {
			result = findOrCreateInvite(this.userId, { rid, days, maxUses });
		});

		return API.v1.success(result);
	},
});

API.v1.addRoute('useInviteToken', { authRequired: true }, {
	post() {
		const { token } = this.bodyParams;
		let result;

		Meteor.runAsUser(this.userId, () => {
			result = useInviteToken(this.userId, token);
		});

		return API.v1.success(result);
	},
});

API.v1.addRoute('validateInviteToken', { authRequired: true }, {
	post() {
		const { token } = this.bodyParams;
		let result;

		Meteor.runAsUser(this.userId, () => {
			result = validateInviteToken(this.userId, token);
		});

		return API.v1.success(result);
	},
});
