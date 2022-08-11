import type { ISetting, ISettingColor } from '@rocket.chat/core-typings';
import { isSettingColor } from '@rocket.chat/core-typings';

export const getSettingDefaults = (
	setting: Partial<ISetting> & Pick<ISetting, '_id' | 'value' | 'type'>,
	blockedSettings: Set<string> = new Set(),
	hiddenSettings: Set<string> = new Set(),
	wizardRequiredSettings: Set<string> = new Set(),
): ISetting => {
	const { _id, value, sorter, ...props } = setting;

	const options = Object.fromEntries(Object.entries(props).filter(([, value]) => value !== undefined));

	return {
		_id,
		value,
		packageValue: value,
		valueSource: 'packageValue',
		secret: false,
		enterprise: false,
		i18nDescription: `${_id}_Description`,
		autocomplete: true,
		sorter: sorter || 0,
		ts: new Date(),
		createdAt: new Date(),
		...options,
		...(options.enableQuery && { enableQuery: JSON.stringify(options.enableQuery) }),
		i18nLabel: options.i18nLabel || _id,
		hidden: options.hidden || hiddenSettings.has(_id),
		blocked: options.blocked || blockedSettings.has(_id),
		requiredOnWizard: options.requiredOnWizard || wizardRequiredSettings.has(_id),
		type: options.type || 'string',
		env: options.env || false,
		public: options.public || false,
		...(options.displayQuery && { displayQuery: JSON.stringify(options.displayQuery) }),
		...(isSettingColor(setting as ISetting) && {
			packageEditor: (setting as ISettingColor).editor,
		}),
	};
};
