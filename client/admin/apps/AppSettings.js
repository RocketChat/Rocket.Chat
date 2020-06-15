import React, { useMemo } from 'react';
import { Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { MemoizedSetting } from '../settings/Setting';
import { useGetAppKey } from './hooks/useGetAppKey';
import { capitalize } from '../../helpers/capitalize';
import { useRouteParameter } from '../../contexts/RouterContext';
import MarkdownText from '../../components/basic/MarkdownText';

export const AppSettingsAssembler = ({ settings, values, handlers }) => <Box>
	{Object.values(settings).map((current) => {
		const { id } = current;
		return <AppSetting key={id} appSetting={current} value={values[id]} onChange={handlers[`handle${ capitalize(id) }`]} />;
	})}
</Box>;

function AppSetting({ appSetting, onChange, value, ...props }) {
	const t = useTranslation();
	const appId = useRouteParameter('id');
	const getAppKey = useGetAppKey(appId);

	const {
		id,
		type,
		i18nLabel,
		i18nDescription,
	} = appSetting;

	const label = (i18nLabel && t(getAppKey(i18nLabel))) || (id || t(getAppKey(id)));
	const hint = useMemo(() => i18nDescription && <MarkdownText content={t(getAppKey(i18nDescription))} />, [i18nDescription]);

	return useMemo(() => <MemoizedSetting
		type={type}
		label={label}
		hint={hint}
		value={value}
		onChangeValue={onChange}
		_id={id}
		{...props}
	/>, [value, onChange]);
}
