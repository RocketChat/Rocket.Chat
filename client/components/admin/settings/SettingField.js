import {
	Callout,
	Field,
} from '@rocket.chat/fuselage';
import React from 'react';

import { MarkdownText } from '../../basic/MarkdownText';
import { RawText } from '../../basic/RawText';
import { useTranslation } from '../../providers/TranslationProvider';
import { useFieldActions } from './SettingsState';
import { GenericSettingInput } from './inputs/GenericSettingInput';
import { BooleanSettingInput } from './inputs/BooleanSettingInput';
import { StringSettingInput } from './inputs/StringSettingInput';

export function SettingField({ field }) {
	const t = useTranslation();
	const { update, reset, disabled } = useFieldActions(field);

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
	} = field;

	const label = (i18nLabel && t(i18nLabel)) || (_id || t(_id));
	const hint = t.has(i18nDescription) && <MarkdownText>{t(i18nDescription)}</MarkdownText>;
	const callout = alert && <RawText>{t(alert)}</RawText>;

	const hasResetButton = !disableReset && !readonly && type !== 'asset' && value !== packageValue && !blocked;
	const onResetButtonClick = () => {
		reset();
	};

	const inputProps = {
		...field,
		label,
		disabled,
		onChange: update,
		hasResetButton,
		onResetButtonClick,
	};

	return <Field>
		{(type === 'boolean' && <BooleanSettingInput {...inputProps} />)
		|| (type === 'string' && <StringSettingInput {...inputProps} />)
		// || (type === 'relativeUrl' && <RelativeUrlSettingInput {...inputProps} />)
		// || (type === 'password' && <PasswordSettingInput {...inputProps} />)
		// || (type === 'int' && <IntSettingInput {...inputProps} />)
		// || (type === 'select' && <SelectSettingInput {...inputProps} />)
		// || (type === 'language' && <LanguageSettingInput {...inputProps} />)
		// || (type === 'color' && <ColorSettingInput {...inputProps} />)
		// || (type === 'font' && <FontSettingInput {...inputProps} />)
		// || (type === 'code' && <CodeSettingInput {...inputProps} />)
		// || (type === 'action' && <ActionSettingInput {...inputProps} />)
		// || (type === 'asset' && <AssetSettingInput {...inputProps} />)
		// || (type === 'roomPick' && <RoomPickSettingInput {...inputProps} />)
		|| <GenericSettingInput {...inputProps} />}
		{hint && <Field.Hint>{hint}</Field.Hint>}
		{callout && <Callout type='warning' title={callout} />}
	</Field>;
}
