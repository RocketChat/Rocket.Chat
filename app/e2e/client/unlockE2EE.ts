import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { isLayoutEmbedded } from '../../../client/lib/utils/isLayoutEmbedded';
import { settings } from '../../settings/client';
import { e2e } from './rocketchat.e2e';

export const unlockE2EE = (): (() => void) | undefined => {
	if (!window.crypto) {
		return undefined;
	}

	const toggleE2EE = (enabled: boolean): void => {
		if (enabled) {
			e2e.startClient();
			e2e.enabled.set(true);
		} else {
			e2e.enabled.set(false);
			e2e.closeAlert();
		}
	};

	const computation = Tracker.autorun(() => {
		if (!Meteor.userId()) {
			toggleE2EE(false);
			return;
		}

		const adminEmbedded = isLayoutEmbedded() && FlowRouter.current().path.startsWith('/admin');

		if (adminEmbedded) {
			toggleE2EE(false);
			return;
		}

		toggleE2EE(settings.get('E2E_Enable'));
	});

	return (): void => {
		computation.stop();
		toggleE2EE(false);
	};
};
