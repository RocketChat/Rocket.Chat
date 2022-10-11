import { ISettingSelectValue } from '@rocket.chat/apps-engine/definition/settings';
import { ISettingBase, SettingValue } from '@rocket.chat/core-typings';
import { useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback, ReactElement } from 'react';

import MarkdownText from '../../../components/MarkdownText';
import MemoizedSetting from '../settings/MemoizedSetting';

type AppTranslationFunction = {
	(key: string, ...replaces: unknown[]): string;
	has: (key: string | undefined) => boolean;
};
const useAppTranslation = (appId: string): AppTranslationFunction => {
	const t = useTranslation();

	const tApp = useCallback(
		(key: string, ...args: unknown[]) => {
			if (!key) {
				return '';
			}
			const appKey = `project:apps-${appId}-${key}`;

			if (t.has(appKey)) {
				return t(appKey, ...args);
			}
			if (t.has(key)) {
				return t(key, ...args);
			}
			return key;
		},
		[t, appId],
	);

	return Object.assign(tApp, {
		has: useCallback(
			(key: string | undefined) => {
				if (!key) {
					return false;
				}

				return t.has(`project:apps-${appId}-${key}`) || t.has(key);
			},
			[t, appId],
		),
	});
};

type AppSettingProps = {
	appSetting: {
		id: string;
		type: ISettingBase['type'];
		i18nLabel: string;
		i18nDescription?: string;
		values?: ISettingSelectValue[];
		required: boolean;
	};
	onChange: (value: SettingValue) => void;
	value: SettingValue;
};
function AppSetting({ appSetting, onChange, value, ...props }: AppSettingProps): ReactElement {
	const appId = useRouteParameter('id');
	const tApp = useAppTranslation(appId || '');

	const { id, type, i18nLabel, i18nDescription, values, required } = appSetting;

	const label = (i18nLabel && tApp(i18nLabel)) + (required ? ' *' : '') || id || tApp(id);
	const hint = useMemo(() => i18nDescription && <MarkdownText content={tApp(i18nDescription)} />, [i18nDescription, tApp]);

	let translatedValues;
	if (values?.length) {
		translatedValues = values.map((selectFieldEntry) => {
			const { key, i18nLabel } = selectFieldEntry;

			if (!i18nLabel) {
				return selectFieldEntry;
			}

			return {
				key,
				i18nLabel: tApp(i18nLabel),
			};
		});
	}

	return (
		<MemoizedSetting
			type={type}
			label={label}
			hint={hint}
			value={value}
			onChangeValue={onChange}
			_id={id}
			{...(translatedValues && { values: translatedValues })}
			{...props}
		/>
	);
}

export default AppSetting;
