import type { ISettingBase, SettingEditor, SettingValue } from '@rocket.chat/core-typings';
import { Box, Callout, Field, FieldHint, Margins } from '@rocket.chat/fuselage';
import type { ElementType, ReactElement, ReactNode } from 'react';
import { memo } from 'react';

import ActionSettingInput from './inputs/ActionSettingInput';
import AssetSettingInput from './inputs/AssetSettingInput';
import BooleanSettingInput from './inputs/BooleanSettingInput';
import CodeSettingInput from './inputs/CodeSettingInput';
import ColorSettingInput from './inputs/ColorSettingInput';
import FontSettingInput from './inputs/FontSettingInput';
import GenericSettingInput from './inputs/GenericSettingInput';
import IntSettingInput from './inputs/IntSettingInput';
import LanguageSettingInput from './inputs/LanguageSettingInput';
import LookupSettingInput from './inputs/LookupSettingInput';
import MultiSelectSettingInput from './inputs/MultiSelectSettingInput';
import PasswordSettingInput from './inputs/PasswordSettingInput';
import RelativeUrlSettingInput from './inputs/RelativeUrlSettingInput';
import RoomPickSettingInput from './inputs/RoomPickSettingInput';
import SelectSettingInput from './inputs/SelectSettingInput';
import SelectTimezoneSettingInput from './inputs/SelectTimezoneSettingInput';
import StringSettingInput from './inputs/StringSettingInput';
import TimespanSettingInput from './inputs/TimespanSettingInput';

// @todo: the props are loosely typed because `Setting` needs to typecheck them.
const inputsByType: Record<ISettingBase['type'], ElementType<any>> = {
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
	lookup: LookupSettingInput,
	timespan: TimespanSettingInput,
	date: GenericSettingInput, // @todo: implement
	group: GenericSettingInput, // @todo: implement
};

type MemoizedSettingProps = {
	_id?: string;
	type: ISettingBase['type'];
	packageValue: ISettingBase['packageValue'];
	hint?: ReactNode;
	callout?: ReactNode;
	value?: SettingValue;
	editor?: SettingEditor;
	onChangeValue?: (value: SettingValue) => void;
	onChangeEditor?: (value: SettingEditor) => void;
	onResetButtonClick?: () => void;
	className?: string;
	invisible?: boolean;
	label?: ReactNode;
	sectionChanged?: boolean;
	hasResetButton?: boolean;
	disabled?: boolean;
	required?: boolean;
	showUpgradeButton?: ReactNode;
	actionText?: string;
};

const MemoizedSetting = ({
	type,
	hint = undefined,
	callout = undefined,
	value = undefined,
	editor = undefined,
	onChangeValue,
	onChangeEditor,
	disabled,
	showUpgradeButton,
	className = undefined,
	invisible = undefined,
	...inputProps
}: MemoizedSettingProps): ReactElement | null => {
	if (invisible) {
		return null;
	}

	const InputComponent = inputsByType[type];

	return (
		<Field className={className} flexDirection='row' justifyContent='space-between' alignItems='flex-start'>
			<Box flexDirection='column' flexGrow={1} wordBreak='break-word' w='full'>
				<InputComponent
					value={value}
					hint={hint}
					editor={editor}
					onChangeValue={onChangeValue}
					onChangeEditor={onChangeEditor}
					disabled={disabled}
					{...inputProps}
				/>
				{hint && type !== 'code' && <FieldHint>{hint}</FieldHint>}
				{callout && (
					<Margins block={16}>
						<Callout type='warning'>{callout}</Callout>
					</Margins>
				)}
				{showUpgradeButton}
			</Box>
		</Field>
	);
};

export default memo(MemoizedSetting);
