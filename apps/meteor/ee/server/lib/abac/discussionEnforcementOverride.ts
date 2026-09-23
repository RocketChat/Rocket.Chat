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
	// Conditional on an empty capture so that only one writer takes it: a restart replay, and a second
	// instance that has already seen the `false` written below, would otherwise record that `false` as
	// the workspace's own value.
	if (settings.get<string>(RESTORE) === '') {
		const previous = settings.get<boolean>(DISCUSSION_ENABLED);

		if (typeof previous !== 'boolean') {
			logger.warn({ msg: 'Skipped the Discussion_enabled override, the setting is not loaded yet' });
			return;
		}

		const { modifiedCount } = await Settings.updateOne(
			{ _id: RESTORE, blocked: { $ne: true }, value: '' },
			{ $set: { value: previous ? 'true' : 'false' } },
		);

		if (modifiedCount) {
			void notifyOnSettingChangedById(RESTORE);

			// TODO: belongs in the Logs tab as an auditable event, once that list is settled.
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

// From the record, never the cache: the cache trails a write by a broadcast, and once the licence is
// gone it answers for this setting with its `invalidValue`, either of which reads as no capture.
const restoreNow = async (): Promise<void> => restoreTo((await Settings.findOneById(RESTORE))?.value);

const applyNow = async (): Promise<void> => {
	// `ABAC_Enforce_All_Rooms` keeps its last saved value while ABAC itself is off, so both are read.
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

// The settings watcher discards the returned promise, so without a queue two fires can interleave one
// run's read of the capture with the other's write.
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

/**
 * `onToggledFeature` seeds its state from `hasModule`, so a server that boots with the module already
 * gone runs neither `up` nor `down` and would keep the `false` the override wrote. Call only once the
 * licence has been applied.
 */
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
