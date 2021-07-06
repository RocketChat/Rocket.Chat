import React, { useMemo, useCallback } from 'react';

import MarkdownText from '../../../components/MarkdownText';
import { useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
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
	const hint = useMemo(
		() => i18nDescription && <MarkdownText content={tApp(i18nDescription)} />,
		[i18nDescription, tApp],
	);

	return (
		<MemoizedSetting
			type={type}
			label={label}
			hint={hint}
			value={value}
			onChangeValue={onChange}
			_id={id}
			values={values}
			{...props}
		/>
	);
}

export default AppSetting;
