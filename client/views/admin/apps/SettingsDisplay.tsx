import React, { FC, useMemo, useEffect, MutableRefObject } from 'react';
import { Box, Divider } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useForm } from '../../../hooks/useForm';
import { AppSettingsAssembler } from './AppSettings';
import { ISetting } from '../../../../definition/ISetting';

type SettingsDisplayProps = {
	settings: {
		[id: string]: ISetting & { id: ISetting['_id'] };
	};
	setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
	settingsRef: MutableRefObject<Record<string, ISetting['value']>>;
};

const SettingsDisplay: FC<SettingsDisplayProps> = ({
	settings,
	setHasUnsavedChanges,
	settingsRef,
}) => {
	const t = useTranslation();

	const stringifiedSettings = JSON.stringify(settings);

	const reducedSettings = useMemo(() => {
		const settings: SettingsDisplayProps['settings'] = JSON.parse(stringifiedSettings);
		return Object.values(settings)
			.reduce((ret, { id, value, packageValue }) => ({ ...ret, [id]: value ?? packageValue }), {});
	}, [stringifiedSettings]);

	const { values, handlers, hasUnsavedChanges } = useForm(reducedSettings);
	const stringifiedValues = JSON.stringify(values);

	useEffect(() => {
		const values = JSON.parse(stringifiedValues);
		setHasUnsavedChanges(hasUnsavedChanges);
		settingsRef.current = values;
	}, [hasUnsavedChanges, stringifiedValues, setHasUnsavedChanges, settingsRef]);

	return <>
		<Divider />
		<Box display='flex' flexDirection='column'>
			<Box fontScale='s2' mb='x12'>{t('Settings')}</Box>
			<AppSettingsAssembler settings={settings} values={values} handlers={handlers}/>
		</Box>
	</>;
};

export default SettingsDisplay;
