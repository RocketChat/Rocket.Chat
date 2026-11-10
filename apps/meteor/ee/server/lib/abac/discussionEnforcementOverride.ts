import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';
import { Settings } from '@rocket.chat/models';

import { notifyOnSettingChangedById } from '../../../../server/lib/notifyListener';
import { settings } from '../../../../server/settings';

const logger = new Logger('ABACDiscussionOverride');

const DISCUSSION_ENABLED = 'Discussion_enabled';
const RESTORE = 'ABAC_Discussion_Enabled_Restore';

const writeSetting = async (_id: string, value: boolean | string): Promise<void> => {
	const { modifiedCount } = await Settings.updateValueById(_id, value);
	if (modifiedCount) {
		void notifyOnSettingChangedById(_id);
	}
};

const captureAndDisable = async (): Promise<void> => {
	if (settings.get<string>(RESTORE) === '') {
		const previous = settings.get<boolean>(DISCUSSION_ENABLED);

		if (typeof previous !== 'boolean') {
			logger.warn({ msg: 'Skipped the Discussion_enabled override, the setting is not loaded yet' });
			return;
		}

		const { modifiedCount } = await Settings.updateValueById(RESTORE, previous ? 'true' : 'false');

		if (modifiedCount) {
			void notifyOnSettingChangedById(RESTORE);

			logger.info({ msg: 'ABAC enforcement enabled: Discussion_enabled overridden to false', previous });
		}
	}

	await writeSetting(DISCUSSION_ENABLED, false);
};

const restoreTo = async (captured: unknown): Promise<void> => {
	if (captured !== 'true' && captured !== 'false') {
		return;
	}

	await writeSetting(DISCUSSION_ENABLED, captured === 'true');
	await writeSetting(RESTORE, '');

	logger.info({ msg: 'ABAC enforcement disabled: Discussion_enabled restored', restored: captured === 'true' });
};

// reads the record: without the licence the cache holds invalidValue
const restoreNow = async (): Promise<void> => restoreTo((await Settings.findOneById(RESTORE))?.value);

const applyNow = async (): Promise<void> => {
	const enforcing = Boolean(settings.get('ABAC_Enabled')) && Boolean(settings.get('ABAC_Enforce_All_Rooms'));

	try {
		if (enforcing) {
			await captureAndDisable();
			return;
		}

		await restoreNow();
	} catch (err) {
		logger.error({ msg: 'Failed to apply the Discussion_enabled enforcement override', enforcing, err });
	}
};

let pending: Promise<void> = Promise.resolve();

const enqueue = (task: () => Promise<void>): Promise<void> => {
	pending = pending.catch(() => undefined).then(task);

	return pending;
};

export const applyDiscussionEnforcementOverride = (): Promise<void> => enqueue(applyNow);

export const restoreDiscussionEnabled = (): Promise<void> =>
	enqueue(async () => {
		try {
			await restoreNow();
		} catch (err) {
			logger.error({ msg: 'Failed to restore Discussion_enabled', err });
		}
	});

// onToggledFeature runs neither up nor down when booting without the module; call after the licence is applied
export const restoreDiscussionEnabledWithoutLicense = (): Promise<void> =>
	enqueue(async () => {
		if (License.hasModule('abac')) {
			return;
		}

		try {
			await restoreNow();
		} catch (err) {
			logger.error({ msg: 'Failed to restore Discussion_enabled after a boot without the ABAC module', err });
		}
	});
