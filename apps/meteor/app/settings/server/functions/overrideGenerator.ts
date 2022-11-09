import type { ISetting } from '@rocket.chat/core-typings';

import { convertValue } from './convertValue';

export const overrideGenerator =
	(fn: (key: string) => string | undefined) =>
	(setting: ISetting): ISetting => {
		const overwriteValue = fn(setting._id);
		if (overwriteValue === null || overwriteValue === undefined) {
			return setting;
		}

		const value = convertValue(overwriteValue, setting.type);

		if (value === setting.value) {
			return setting;
		}

		return {
			...setting,
			value,
			processEnvValue: value,
			valueSource: 'processEnvValue',
		};
	};
