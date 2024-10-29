import type { ISettingSelectValue } from '@rocket.chat/apps-engine/definition/settings';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings/ISetting';
import type { App, Serialized } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback } from 'react';
import { Controller } from 'react-hook-form';

import { Utilities } from '../../../../../../ee/lib/misc/Utilities';
import MarkdownText from '../../../../../components/MarkdownText';
import MemoizedSetting from '../../../../admin/settings/Setting/MemoizedSetting';
import { useAppSettingsFormContext } from '../../../hooks/useAppSettingsForm';

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
			const appKey = Utilities.getI18nKeyForApp(key, appId);

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

				return t.has(Utilities.getI18nKeyForApp(key, appId)) || t.has(key);
			},
			[t, appId],
		),
	});
};

type AppSettingProps = Serialized<ISetting> & { appId: App['id'] };

const AppSetting = ({ appId, id, type, i18nLabel, i18nDescription, values, value, packageValue, ...props }: AppSettingProps) => {
	const tApp = useAppTranslation(appId);

	const label = (i18nLabel && tApp(i18nLabel)) || id || tApp(id);
	const hint = useMemo(() => i18nDescription && <MarkdownText content={tApp(i18nDescription)} />, [i18nDescription, tApp]);

	const { control } = useAppSettingsFormContext();

	let translatedValues: ISettingSelectValue[];
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
		<Controller
			defaultValue={value || packageValue}
			name={id}
			control={control}
			render={({ field: { onChange, value } }) => (
				<MemoizedSetting
					packageValue={packageValue}
					type={type}
					label={label}
					hint={hint}
					_id={id}
					{...(translatedValues && { values: translatedValues })}
					{...props}
					onChangeValue={onChange}
					value={value}
				/>
			)}
		/>
	);
};

export default AppSetting;
