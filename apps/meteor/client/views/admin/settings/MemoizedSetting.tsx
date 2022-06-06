import { ISettingBase, SettingEditor, SettingValue } from '@rocket.chat/core-typings';
import { Callout, Field, Margins } from '@rocket.chat/fuselage';
import React, { memo, ReactElement } from 'react';

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

type MemoizedSettingProps = {
	_id?: string;
	type: ISettingBase['type'];
	hint?: ReactElement | string;
	callout?: ReactElement | string;
	value?: SettingValue;
	editor?: SettingEditor;
	onChangeValue?: (value: unknown) => void;
	onChangeEditor?: (value: unknown) => void;
	onResetButtonClick?: () => void;
	className?: string;
	invisible?: boolean;
	label?: string;
	sectionChanged?: boolean;
	hasResetButton?: boolean;
	actionText?: string;
};

const MemoizedSetting = ({
	type,
	hint,
	callout,
	value,
	editor,
	onChangeValue,
	onChangeEditor,
	className,
	invisible,
	...inputProps
}: MemoizedSettingProps): ReactElement => {
	if (invisible) {
		return <></>;
	}

	const InputComponent: (props: any) => ReactElement =
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
		}[type as string] || GenericSettingInput;

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
