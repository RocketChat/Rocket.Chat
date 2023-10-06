import type { UserStatus } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { UserPresence } from 'meteor/rocketchat:user-presence';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';

import { hasPermission } from '../../app/authorization/client';
import { register } from '../../app/markdown/lib/hljs';
import { settings } from '../../app/settings/client';
import { getUserPreference } from '../../app/utils/client';
import 'hljs9/styles/github.css';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { t } from '../../app/utils/lib/i18n';
import * as banners from '../lib/banners';
import { synchronizeUserData, removeLocalUserData } from '../lib/userData';
import { fireGlobalEvent } from '../lib/utils/fireGlobalEvent';

Meteor.startup(() => {
	fireGlobalEvent('startup', true);

	Session.setDefault('AvatarRandom', 0);

	window.lastMessageWindow = {};
	window.lastMessageWindowHistory = {};

	let status: UserStatus | undefined = undefined;
	Tracker.autorun(async () => {
		const uid = Meteor.userId();
		if (!uid) {
			removeLocalUserData();
			return;
		}
		if (!Meteor.status().connected) {
			return;
		}

		const user = await synchronizeUserData(uid);
		if (!user) {
			return;
		}

		const utcOffset = moment().utcOffset() / 60;
		if (user.utcOffset !== utcOffset) {
			sdk.call('userSetUtcOffset', utcOffset);
		}

		if (getUserPreference(user, 'enableAutoAway')) {
			const idleTimeLimit = (getUserPreference(user, 'idleTimeLimit') as number | null | undefined) || 300;
			UserPresence.awayTime = idleTimeLimit * 1000;
		} else {
			delete UserPresence.awayTime;
			UserPresence.stopTimer();
		}

		UserPresence.start();

		if (user.status !== status) {
			status = user.status;
			fireGlobalEvent('status-changed', status);
		}
	});

	Tracker.autorun(async (c) => {
		const uid = Meteor.userId();
		if (!uid) {
			return;
		}

		if (!hasPermission('manage-cloud')) {
			return;
		}

		const {
			registrationStatus: { workspaceRegistered },
		} = await sdk.rest.get('/v1/cloud.registrationStatus');
		c.stop();

		if (workspaceRegistered !== true) {
			banners.open({
				id: 'cloud-registration',
				title: () => t('Cloud_registration_pending_title'),
				html: () => t('Cloud_registration_pending_html'),
				modifiers: ['large', 'danger'],
			});
		}
	});
});
Meteor.startup(() => {
	Tracker.autorun(() => {
		const code = settings.get('Message_Code_highlight') as string | undefined;
		code?.split(',').forEach((language: string) => {
			language.trim() && register(language.trim());
		});
	});
});
