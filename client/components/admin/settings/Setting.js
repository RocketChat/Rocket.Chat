import {
	Callout,
	Field,
} from '@rocket.chat/fuselage';
import React from 'react';

import { MarkdownText } from '../../basic/MarkdownText';
import { RawText } from '../../basic/RawText';
import { useTranslation } from '../../providers/TranslationProvider';
import { GenericSettingInput } from './inputs/GenericSettingInput';
import { BooleanSettingInput } from './inputs/BooleanSettingInput';
import { StringSettingInput } from './inputs/StringSettingInput';
import { RelativeUrlSettingInput } from './inputs/RelativeUrlSettingInput';
import { PasswordSettingInput } from './inputs/PasswordSettingInput';
import { IntSettingInput } from './inputs/IntSettingInput';
import { SelectSettingInput } from './inputs/SelectSettingInput';
import { LanguageSettingInput } from './inputs/LanguageSettingInput';
import { ColorSettingInput } from './inputs/ColorSettingInput';
import { FontSettingInput } from './inputs/FontSettingInput';
import { CodeSettingInput } from './inputs/CodeSettingInput';
import { ActionSettingInput } from './inputs/ActionSettingInput';
import { useSetting } from './SettingsState';

const getInputComponentByType = (type) => ({
	boolean: BooleanSettingInput,
	string: StringSettingInput,
	relativeUrl: RelativeUrlSettingInput,
	password: PasswordSettingInput,
	int: IntSettingInput,
	select: SelectSettingInput,
	language: LanguageSettingInput,
	color: ColorSettingInput,
	font: FontSettingInput,
	code: CodeSettingInput,
	action: ActionSettingInput,
	// asset: AssetSettingInput,
	// roomPick: RoomPickSettingInput,
})[type] || GenericSettingInput;

export function Setting({ settingId }) {
	const setting = useSetting(settingId);

	const t = useTranslation();

	const {
		_id,
		disableReset,
		readonly,
		type,
		value,
		packageValue,
		blocked,
		i18nLabel,
		i18nDescription,
		alert,
	} = setting;

	const label = (i18nLabel && t(i18nLabel)) || (_id || t(_id));
	const hint = t.has(i18nDescription) && <MarkdownText>{t(i18nDescription)}</MarkdownText>;
	const callout = alert && <RawText>{t(alert)}</RawText>;

	const hasResetButton = !disableReset && !readonly && type !== 'asset' && value !== packageValue && !blocked;
	const onResetButtonClick = () => {
		setting.reset();
	};

	const InputComponent = getInputComponentByType(type);

	const inputProps = {
		...setting,
		label,
		onChange: setting.update,
		hasResetButton,
		onResetButtonClick,
	};

	return <Field>
		<InputComponent {...inputProps} />
		{hint && <Field.Hint>{hint}</Field.Hint>}
		{callout && <Callout type='warning' title={callout} />}
	</Field>;
}
