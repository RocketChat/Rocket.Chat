import { Callout, Field, Flex, InputBox, Margins, Skeleton } from '@rocket.chat/fuselage';
import React, { memo, useEffect, useMemo, useState, useCallback } from 'react';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';

import MarkdownText from '../../components/basic/MarkdownText';
import { useEditableSetting, useEditableSettingsDispatch } from '../../contexts/EditableSettingsContext';
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
import { useSettingStructure } from '../../contexts/SettingsContext';

export const MemoizedSetting = memo(function MemoizedSetting({
	type,
	hint,
	callout,
	value,
	editor,
	onChangeValue = () => {},
	onChangeEditor = () => {},
	className,
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

	return <Field className={className}>
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

export function Setting({ className, settingId, sectionChanged }) {
	const setting = useEditableSetting(settingId);

	const persistedSetting = useSettingStructure(settingId);
	const dispatch = useEditableSettingsDispatch();

	const update = useDebouncedCallback(({ value, editor }) => {
		if (!persistedSetting) {
			return;
		}

		dispatch([{
			_id: persistedSetting._id,
			...value !== undefined && { value },
			...editor !== undefined && { editor },
			changed:
				JSON.stringify(persistedSetting.value) !== JSON.stringify(value)
				|| JSON.stringify(persistedSetting.editor) !== JSON.stringify(editor),
		}]);
	}, 230, [persistedSetting, dispatch]);

	const t = useTranslation();

	const [value, setValue] = useState(setting.value);
	const [editor, setEditor] = useState(setting.editor);

	useEffect(() => {
		setValue(setting.value);
	}, [setting.value]);

	useEffect(() => {
		setEditor(setting.editor);
	}, [setting.editor]);

	const onChangeValue = useCallback((value) => {
		setValue(value);
		update({ value });
	}, [update]);

	const onChangeEditor = useCallback((editor) => {
		setEditor(editor);
		update({ editor });
	}, [update]);

	const onResetButtonClick = useCallback(() => {
		setValue(setting.value);
		setEditor(setting.editor);
		update({
			value: persistedSetting.packageValue,
			editor: persistedSetting.packageEditor,
		});
	}, [setting.value, setting.editor, update, persistedSetting]);

	const {
		_id,
		disabled,
		disableReset,
		readonly,
		type,
		packageEditor,
		packageValue,
		i18nLabel,
		i18nDescription,
		alert,
	} = setting;

	const label = (i18nLabel && t(i18nLabel)) || (_id || t(_id));
	const hint = useMemo(() => t.has(i18nDescription) && <MarkdownText preserveHtml={true} content={t(i18nDescription)} />, [i18nDescription, t]);
	const callout = useMemo(() => alert && <span dangerouslySetInnerHTML={{ __html: t(alert) }} />, [alert, t]);
	const hasResetButton = !disableReset && !readonly && type !== 'asset' && (JSON.stringify(packageEditor) !== JSON.stringify(editor) || JSON.stringify(value) !== JSON.stringify(packageValue)) && !disabled;

	return <MemoizedSetting
		className={className}
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
