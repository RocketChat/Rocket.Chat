import { Callout, Field, InputBox, Label, Margins, Skeleton } from '@rocket.chat/fuselage';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import React, { useEffect, useMemo, useState } from 'react';

import { MarkdownText } from '../../basic/MarkdownText';
import { RawText } from '../../basic/RawText';
import { useTranslation } from '../../../contexts/TranslationContext';
import { GenericSettingInput } from './inputs/GenericSettingInput';
import { BooleanSettingInput } from './inputs/BooleanSettingInput';
import { StringSettingInput } from './inputs/StringSettingInput';
import { RelativeUrlSettingInput } from './inputs/RelativeUrlSettingInput';
import { PasswordSettingInput } from './inputs/PasswordSettingInput';
import { IntSettingInput } from './inputs/IntSettingInput';
import { SelectSettingInput } from './inputs/SelectSettingInput';
import { MultiSelectSettingInput } from './inputs/MultiSelectSettingInput';
import { LanguageSettingInput } from './inputs/LanguageSettingInput';
import { ColorSettingInput } from './inputs/ColorSettingInput';
import { FontSettingInput } from './inputs/FontSettingInput';
import { CodeSettingInput } from './inputs/CodeSettingInput';
import { ActionSettingInput } from './inputs/ActionSettingInput';
import { AssetSettingInput } from './inputs/AssetSettingInput';
import { RoomPickSettingInput } from './inputs/RoomPickSettingInput';
import { useSetting } from './SettingsState';

const getInputComponentByType = (type) => ({
	boolean: BooleanSettingInput,
	string: StringSettingInput,
	relativeUrl: RelativeUrlSettingInput,
	password: PasswordSettingInput,
	int: IntSettingInput,
	multiselect: MultiSelectSettingInput,
	select: SelectSettingInput,
	language: LanguageSettingInput,
	color: ColorSettingInput,
	font: FontSettingInput,
	code: CodeSettingInput,
	action: ActionSettingInput,
	asset: AssetSettingInput,
	roomPick: RoomPickSettingInput,
})[type] || GenericSettingInput;

const MemoizedSetting = React.memo(function MemoizedSetting({
	type,
	hint,
	callout,
	...inputProps
}) {
	const InputComponent = getInputComponentByType(type);

	return <Field>
		<InputComponent {...inputProps} />
		{hint && <Field.Hint>{hint}</Field.Hint>}
		<Margins block='16'>
			{callout && <Callout type='warning' children={callout} />}
		</Margins>
	</Field>;
});

export function Setting({ settingId }) {
	const {
		value: contextValue,
		editor: contextEditor,
		...setting
	} = useSetting(settingId);

	const t = useTranslation();

	const [value, setValue] = useState(contextValue);
	const setContextValue = useDebouncedCallback((value) => setting.update({ value }), 70, []);

	useEffect(() => {
		setValue(contextValue);
	}, [contextValue]);

	const [editor, setEditor] = useState(contextEditor);
	const setContextEditor = useDebouncedCallback((editor) => setting.update({ editor }), 70, []);

	useEffect(() => {
		setEditor(contextEditor);
	}, [contextEditor]);

	const onChangeValue = (value) => {
		setValue(value);
		setContextValue(value);
	};

	const onChangeEditor = (editor) => {
		setEditor(editor);
		setContextEditor(editor);
	};

	const onResetButtonClick = () => {
		setting.reset();
	};

	const {
		_id,
		disabled,
		disableReset,
		readonly,
		type,
		packageValue,
		i18nLabel,
		i18nDescription,
		alert,
	} = setting;

	const label = (i18nLabel && t(i18nLabel)) || (_id || t(_id));
	const hint = useMemo(() => t.has(i18nDescription) && <MarkdownText>{t(i18nDescription)}</MarkdownText>, [i18nDescription]);
	const callout = useMemo(() => alert && <RawText>{t(alert)}</RawText>, [alert]);
	const hasResetButton = !disableReset && !readonly && type !== 'asset' && JSON.stringify(value) !== JSON.stringify(packageValue) && !disabled;

	return <MemoizedSetting
		type={type}
		label={label}
		hint={hint}
		callout={callout}
		{...setting}
		value={value}
		editor={editor}
		hasResetButton={hasResetButton}
		onChangeValue={onChangeValue}
		onChangeEditor={onChangeEditor}
		onResetButtonClick={onResetButtonClick}
	/>;
}

Setting.Skeleton = function SettingSkeleton() {
	return <Field>
		<Label>
			<Skeleton width='25%' />
		</Label>
		<InputBox.Skeleton />
	</Field>;
};
