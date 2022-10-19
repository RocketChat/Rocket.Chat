import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { SettingValue } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useMemo, useEffect, MutableRefObject } from 'react';

import { ISettings } from '../../../../app/apps/client/@types/IOrchestrator';
import { useForm } from '../../../hooks/useForm';
import AppSettingsAssembler from './AppSettingsAssembler';

type SettingsDisplayProps = {
	settings: ISettings;
	setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
	settingsRef: MutableRefObject<Record<string, ISetting['value']>>;
};

const SettingsDisplay: FC<SettingsDisplayProps> = ({ settings, setHasUnsavedChanges, settingsRef }) => {
	const t = useTranslation();

	const stringifiedSettings = JSON.stringify(settings);

	const reducedSettings = useMemo(() => {
		const settings: SettingsDisplayProps['settings'] = JSON.parse(stringifiedSettings);
		return Object.values(settings).reduce((ret, { id, value, packageValue }) => ({ ...ret, [id]: value ?? packageValue }), {});
	}, [stringifiedSettings]);

	const { values, handlers, hasUnsavedChanges } = useForm(reducedSettings) as {
		values: Record<string, SettingValue>;
		handlers: Record<string, (eventOrValue: SettingValue) => void>;
		hasUnsavedChanges: boolean;
	};
	const stringifiedValues = JSON.stringify(values);

	useEffect(() => {
		const values = JSON.parse(stringifiedValues);
		setHasUnsavedChanges(hasUnsavedChanges);
		settingsRef.current = values;
	}, [hasUnsavedChanges, stringifiedValues, setHasUnsavedChanges, settingsRef]);

	return (
		<>
			<Box display='flex' flexDirection='column' maxWidth='x640' w='full' marginInline='auto'>
				<Box fontScale='h4' mb='x12'>
					{t('Settings')}
				</Box>
				<AppSettingsAssembler settings={settings} values={values} handlers={handlers} />
			</Box>
		</>
	);
};

export default SettingsDisplay;
