import type { ISettingSelectValue } from '@rocket.chat/apps-engine/definition/settings';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings/ISetting';
import { useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import MarkdownText from '../../../../../components/MarkdownText';
import MemoizedSetting from '../../../../admin/settings/Setting/MemoizedSetting';
import { useAppTranslation } from '../../../hooks/useAppTranslation';

const AppSetting = ({ id, type, i18nLabel, i18nDescription, values, value, packageValue, ...props }: ISetting): ReactElement => {
	const appId = useRouteParameter('id');
	const tApp = useAppTranslation(appId || '');

	const label = (i18nLabel && tApp(i18nLabel)) || id || tApp(id);
	const hint = useMemo(() => i18nDescription && <MarkdownText content={tApp(i18nDescription)} />, [i18nDescription, tApp]);

	const { control } = useFormContext();

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
