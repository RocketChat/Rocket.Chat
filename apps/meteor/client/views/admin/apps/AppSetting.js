import { useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback } from 'react';

import MarkdownText from '../../../components/MarkdownText';
import MemoizedSetting from '../settings/MemoizedSetting';

const useAppTranslation = (appId) => {
	const t = useTranslation();

	const tApp = useCallback(
		(key, ...args) => {
			if (!key) {
				return '';
			}

			const appKey = `project:apps-${appId}-${key}`;
			return t(t.has(appKey) ? appKey : key, ...args);
		},
		[t, appId],
	);

	tApp.has = useCallback(
		(key) => {
			if (!key) {
				return false;
			}

			return t.has(`project:apps-${appId}-${key}`) || t.has(key);
		},
		[t, appId],
	);

	return tApp;
};

function AppSetting({ appSetting, onChange, value, ...props }) {
	const appId = useRouteParameter('id');
	const tApp = useAppTranslation(appId);

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
			values={translatedValues}
			{...props}
		/>
	);
}

export default AppSetting;
