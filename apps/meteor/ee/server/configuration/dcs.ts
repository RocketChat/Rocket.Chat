import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../server/settings';
import { backfillAccessRequirements } from '../lib/dcs/backfillAccessRequirements';
import { policies } from '../lib/dcs/policies';

const logger = new Logger('DataCentricSecurity');

Meteor.startup(async () => {
	let stopWatcher: () => void;
	let unregisterHooks: () => void;

	License.onToggledFeature('abac', {
		up: async () => {
			const { addSettings } = await import('../settings/dcs');
			await addSettings();

			const { registerDcsHooks } = await import('../hooks/dcs');
			unregisterHooks = registerDcsHooks();

			stopWatcher = settings.watch<string>('DCS_Policy', (xml) => {
				try {
					const loaded = policies.replaceAll(xml?.trim() ? [xml] : []);
					logger.info({ msg: 'Security policies loaded', policies: loaded.map(({ id, name, version }) => ({ id, name, version })) });
					void backfillAccessRequirements().then(
						(updated) => updated && logger.info({ msg: 'Stored access requirements of labeled messages', updated }),
						(error) => logger.error({ msg: 'Failed to store access requirements of labeled messages', err: error }),
					);
				} catch (error) {
					logger.error({ msg: 'Invalid SPIF; keeping the previous security policies', err: error });
				}
			});
		},
		down: async () => {
			stopWatcher?.();
			unregisterHooks?.();
		},
	});
});
