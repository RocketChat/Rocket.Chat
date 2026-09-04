import { Settings } from '@rocket.chat/models';

import { bumpBannerConfigToV2 } from './lib/bumpBannerConfigToV2';
import { addMigration } from '../../lib/migrations';

const SETTING_ID = 'ABAC_Classification_Banners_Config';

/**
 * ABAC-P4 M4 — bumps the classification-banner config to schema v2.
 *
 * v2 adds an optional `nonAbacBanner`, so it is a strict superset of v1: the only change a stored
 * v1 document needs is its `version` field. Nothing else is rewritten, and no `nonAbacBanner` is
 * synthesised — its absence means "no banner in rooms without attributes", which is exactly the
 * pre-v2 behaviour, so an existing configuration keeps rendering as it did.
 *
 * The schema is `additionalProperties: false` with `version` as a `const`, which is why the bump
 * cannot be skipped: a v1 document would fail validation the moment an admin re-saved it.
 *
 * Rollback: set `version` back to `1` and delete `nonAbacBanner` if present.
 *   db.rocketchat_settings.updateOne(
 *     { _id: 'ABAC_Classification_Banners_Config' },
 *     [{ $set: { value: { $literal: <the v1 JSON string> } } }]
 *   )
 * In practice, re-running this migration's inverse by hand on the single affected document is
 * simpler than a scripted down(), since the value is an opaque JSON string.
 */
addMigration({
	version: 336,
	name: 'Bump ABAC classification banners config to schema version 2',
	async up() {
		const setting = await Settings.findOneById(SETTING_ID, { projection: { value: 1 } });

		const migrated = bumpBannerConfigToV2(setting?.value);

		if (migrated === null) {
			return;
		}

		await Settings.updateOne({ _id: SETTING_ID }, { $set: { value: migrated } });
	},
});
