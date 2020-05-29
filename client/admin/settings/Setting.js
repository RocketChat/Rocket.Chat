import { Callout, Field, Flex, InputBox, Margins, Skeleton } from '@rocket.chat/fuselage';
import React, { memo, useEffect, useMemo, useState, useCallback } from 'react';

import MarkdownText from '../../components/basic/MarkdownText';
import RawText from '../../components/basic/RawText';
import { useTranslation } from '../../contexts/TranslationContext';
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

export const MemoizedSetting = memo(function MemoizedSetting({
	type,
	hint,
	callout,
	value,
	editor,
	onChangeValue = () => {},
	onChangeEditor = () => {},
	...inputProps
}) {
	const InputComponent = {
		boolean: BooleanSettingInput,
		string: StringSettingInput,
		relativeUrl: RelativeUrlSettingInput,
		password: PasswordSettingInput,
		int: IntSettingInput,
		select: SelectSettingInput,
		multiSelect: MultiSelectSettingInput,
		language: LanguageSettingInput,
		color: ColorSettingInput,
		font: FontSettingInput,
		code: CodeSettingInput,
		action: ActionSettingInput,
		asset: AssetSettingInput,
		roomPick: RoomPickSettingInput,
	}[type] || GenericSettingInput;

	return <Field>
		<InputComponent
			value={value}
			editor={editor}
			onChangeValue={onChangeValue}
			onChangeEditor={onChangeEditor}
			{...inputProps}
		/>
		{hint && <Field.Hint>{hint}</Field.Hint>}
		{callout && <Margins block='x16'>
			<Callout type='warning'>{callout}</Callout>
		</Margins>}
	</Field>;
});

export function Setting({ settingId, sectionChanged }) {
	const {
		value: contextValue,
		editor: contextEditor,
		packageEditor,
		update,
		reset,
		...setting
	} = useSetting(settingId);


	const t = useTranslation();

	const [value, setValue] = useState(contextValue);
	const [editor, setEditor] = useState(contextEditor);

	useEffect(() => {
		setValue(contextValue);
	}, [contextValue]);

	useEffect(() => {
		setEditor(contextEditor);
	}, [contextEditor]);

	const onChangeValue = useCallback((value) => {
		setValue(value);
		update({ value });
	}, [update]);

	const onChangeEditor = useCallback((editor) => {
		setEditor(editor);
		update({ editor });
	}, [update]);

	const onResetButtonClick = useCallback(() => {
		setValue(contextValue);
		setEditor(contextEditor);
		reset();
	}, [contextValue, contextEditor, reset]);

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
	const hasResetButton = !disableReset && !readonly && type !== 'asset' && (JSON.stringify(packageEditor) !== JSON.stringify(editor) || JSON.stringify(value) !== JSON.stringify(packageValue)) && !disabled;

	return <MemoizedSetting
		type={type}
		label={label}
		hint={hint}
		callout={callout}
		sectionChanged={sectionChanged}
		{...setting}
		value={value}
		editor={editor}
		hasResetButton={hasResetButton}
		onChangeValue={onChangeValue}
		onChangeEditor={onChangeEditor}
		onResetButtonClick={onResetButtonClick}
	/>;
}

export function SettingSkeleton() {
	return <Field>
		<Flex.Item align='stretch'>
			<Field.Label>
				<Skeleton width='25%' />
			</Field.Label>
		</Flex.Item>
		<Field.Row>
			<InputBox.Skeleton />
		</Field.Row>
	</Field>;
}

Setting.Memoized = MemoizedSetting;
Setting.Skeleton = SettingSkeleton;
