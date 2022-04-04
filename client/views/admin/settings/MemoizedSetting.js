import { Callout, Field, Margins } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

import ActionSettingInput from './inputs/ActionSettingInput';
import AssetSettingInput from './inputs/AssetSettingInput';
import BooleanSettingInput from './inputs/BooleanSettingInput';
import CodeSettingInput from './inputs/CodeSettingInput';
import ColorSettingInput from './inputs/ColorSettingInput';
import FontSettingInput from './inputs/FontSettingInput';
import GenericSettingInput from './inputs/GenericSettingInput';
import IntSettingInput from './inputs/IntSettingInput';
import LanguageSettingInput from './inputs/LanguageSettingInput';
import MultiSelectSettingInput from './inputs/MultiSelectSettingInput';
import PasswordSettingInput from './inputs/PasswordSettingInput';
import RelativeUrlSettingInput from './inputs/RelativeUrlSettingInput';
import RoomPickSettingInput from './inputs/RoomPickSettingInput';
import SelectSettingInput from './inputs/SelectSettingInput';
import SelectTimezoneSettingInput from './inputs/SelectTimezoneSettingInput';
import StringSettingInput from './inputs/StringSettingInput';

const MemoizedSetting = ({
	type,
	hint = undefined,
	callout = undefined,
	value = undefined,
	editor = undefined,
	onChangeValue = () => {},
	onChangeEditor = () => {},
	className = undefined,
	invisible = undefined,
	...inputProps
}) => {
	if (invisible) {
		return null;
	}

	const InputComponent =
		{
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
			timezone: SelectTimezoneSettingInput,
		}[type] || GenericSettingInput;

	return (
		<Field className={className}>
			<InputComponent value={value} editor={editor} onChangeValue={onChangeValue} onChangeEditor={onChangeEditor} {...inputProps} />
			{hint && <Field.Hint>{hint}</Field.Hint>}
			{callout && (
				<Margins block='x16'>
					<Callout type='warning'>{callout}</Callout>
				</Margins>
			)}
		</Field>
	);
};

export default memo(MemoizedSetting);
