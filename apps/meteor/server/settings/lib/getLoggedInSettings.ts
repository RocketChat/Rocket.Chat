import { EnterpriseSettings } from '@rocket.chat/core-services';
import type { ISetting, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import { isSettingEnterprise } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

import { getSettingsCacheKey } from './getSettingsCacheKey';

type LoggedInSettings = {
	update: ISetting[];
	remove: Pick<RocketChatRecordDeleted<ISetting>, '_id' | '_deletedAt'>[];
	cacheKey: string;
	reset: boolean;
};

const withEffectiveValues = (settings: ISetting[]): Promise<ISetting[]> =>
	Promise.all(
		settings.map(async (setting) => {
			if (!isSettingEnterprise(setting)) {
				return setting;
			}

			const value = await EnterpriseSettings.changeSettingValue(setting);
			return value === undefined ? setting : { ...setting, value };
		}),
	);

export const getLoggedInSettings = async ({
	updatedSince,
	cacheKey,
}: {
	updatedSince?: Date;
	cacheKey?: string;
}): Promise<LoggedInSettings> => {
	const currentCacheKey = await getSettingsCacheKey();

	if (!updatedSince || cacheKey !== currentCacheKey) {
		return {
			update: await withEffectiveValues(await Settings.findNotHiddenLoggedIn().toArray()),
			remove: [],
			cacheKey: currentCacheKey,
			reset: true,
		};
	}

	const [update, remove] = await Promise.all([
		Settings.findNotHiddenLoggedIn(updatedSince).toArray(),
		Settings.trashFindDeletedLoggedInAfter(updatedSince).toArray(),
	]);

	return {
		update: await withEffectiveValues(update),
		remove,
		cacheKey: currentCacheKey,
		reset: false,
	};
};
