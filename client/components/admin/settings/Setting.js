import { Callout, Field, Flex, InputBox, Margins, Skeleton } from '@rocket.chat/fuselage';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, useEffect, useMemo, useState, useCallback } from 'react';

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
		{callout && <Margins block='16'>
			<Callout type='warning'>{callout}</Callout>
		</Margins>}
	</Field>;
});

export function Setting({ settingId }) {
	const {
		value: contextValue,
		editor: contextEditor,
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

	const updateContext = useDebouncedCallback((props) => update(props), 70, [update]);

	const onChangeValue = useCallback((value) => {
		setValue(value);
		updateContext({ value });
	}, [updateContext]);

	const onChangeEditor = useCallback((editor) => {
		setEditor(editor);
		updateContext({ editor });
	}, [updateContext]);

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
	const hasResetButton = !disableReset && !readonly && type !== 'asset' && value !== packageValue && !disabled;

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
