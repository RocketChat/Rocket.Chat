import { Logger } from '@rocket.chat/logger';
import { Settings } from '@rocket.chat/models';

import { notifyOnSettingChangedById } from '../../../../server/lib/notifyListener';
import { settings } from '../../../../server/settings';

const logger = new Logger('ABACDiscussionOverride');

const DISCUSSION_ENABLED = 'Discussion_enabled';
const RESTORE = 'ABAC_Discussion_Enabled_Restore';

/**
 * ABAC-P4/D10 — while ABAC enforcement is on, discussion creation is blocked workspace-wide by
 * holding `Discussion_enabled` at `false`. The value it had beforehand is captured verbatim in
 * `ABAC_Discussion_Enabled_Restore` and written back when enforcement is switched off.
 *
 * Only the setting's *value* is overridden. Its definition — which lives in CE
 * (`server/settings/discussions.ts`) — is never edited, re-registered or gated, so nothing here can
 * change how the setting behaves on a workspace without the `abac` module. Attempts to turn the
 * setting back on while enforcement is active are refused by the declarative validation rule
 * attached at its definition, not by this module.
 *
 * `''` in the restore setting means "no override in effect", which makes restore a no-op rather
 * than a guess.
 */

const writeSetting = async (_id: string, value: boolean | string): Promise<void> => {
	const { modifiedCount } = await Settings.updateValueById(_id, value);
	if (modifiedCount) {
		void notifyOnSettingChangedById(_id);
	}
};

const captureAndDisable = async (): Promise<void> => {
	// Idempotent: a non-empty restore value means the override is already in effect, so re-running
	// (a server restart with enforcement already on) must not overwrite the captured value with the
	// `false` this function itself wrote.
	if (settings.get<string>(RESTORE) !== '') {
		return;
	}

	const previous = settings.get<boolean>(DISCUSSION_ENABLED);

	await writeSetting(RESTORE, previous ? 'true' : 'false');
	await writeSetting(DISCUSSION_ENABLED, false);

	// TODO(ABAC-P4/D15): enforcement being switched on or off is an auditable event and belongs in
	// the Phase 3 Logs tab, not only in the server log. Adding it means a new event in the typed
	// `abac.*` union, an `Audit` helper and Logs-tab rendering; the auditable event list is still
	// open, so this stays a structured log line for now.
	logger.info({ msg: 'ABAC enforcement enabled: Discussion_enabled overridden to false', previous });
};

export const restoreDiscussionEnabled = async (): Promise<void> => {
	const captured = settings.get<string>(RESTORE);

	if (captured !== 'true' && captured !== 'false') {
		// Nothing was captured, so there is no override to undo.
		return;
	}

	await writeSetting(DISCUSSION_ENABLED, captured === 'true');
	await writeSetting(RESTORE, '');

	logger.info({ msg: 'ABAC enforcement disabled: Discussion_enabled restored', restored: captured === 'true' });
};

/**
 * Enforcement is only in effect when ABAC itself is on — `ABAC_Enforce_All_Rooms` carries an
 * `enableQuery` on `ABAC_Enabled`, but that governs the admin field, not the stored value, so both
 * are read here.
 */
export const applyDiscussionEnforcementOverride = async (): Promise<void> => {
	const enforcing = settings.get<boolean>('ABAC_Enabled') && settings.get<boolean>('ABAC_Enforce_All_Rooms');

	try {
		if (enforcing) {
			await captureAndDisable();
			return;
		}

		await restoreDiscussionEnabled();
	} catch (err) {
		logger.error({ msg: 'Failed to apply the Discussion_enabled enforcement override', enforcing, err });
	}
};
