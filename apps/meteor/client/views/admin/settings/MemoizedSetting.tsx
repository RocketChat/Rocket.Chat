import type { ISettingBase, SettingEditor, SettingValue } from '@rocket.chat/core-typings';
import { Box, Button, Callout, Field, Margins } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ElementType, ReactElement, ReactNode } from 'react';
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
import LookupSettingInput from './inputs/LookupSettingInput';
import MultiSelectSettingInput from './inputs/MultiSelectSettingInput';
import PasswordSettingInput from './inputs/PasswordSettingInput';
import RelativeUrlSettingInput from './inputs/RelativeUrlSettingInput';
import RoomPickSettingInput from './inputs/RoomPickSettingInput';
import SelectSettingInput from './inputs/SelectSettingInput';
import SelectTimezoneSettingInput from './inputs/SelectTimezoneSettingInput';
import StringSettingInput from './inputs/StringSettingInput';

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
	date: GenericSettingInput, // @todo: implement
	group: GenericSettingInput, // @todo: implement
};

type MemoizedSettingProps = {
	_id?: string;
	type: ISettingBase['type'];
	hint?: ReactNode;
	callout?: ReactNode;
	value?: SettingValue;
	editor?: SettingEditor;
	onChangeValue?: (value: SettingValue) => void;
	onChangeEditor?: (value: unknown) => void;
	onResetButtonClick?: () => void;
	className?: string;
	invisible?: boolean;
	label?: string;
	sectionChanged?: boolean;
	hasResetButton?: boolean;
	disabled?: boolean;
	enterpriseCallout?: ReactNode;
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
	enterpriseCallout,
	className = undefined,
	invisible = undefined,
	...inputProps
}: MemoizedSettingProps): ReactElement | null => {
	const t = useTranslation();
	if (invisible) {
		return null;
	}

	const InputComponent = inputsByType[type];

	return (
		<Field className={className} flexDirection='row' justifyContent='space-between' alignItems='flex-start'>
			<Box flexDirection='column' flexGrow={1}>
				<InputComponent
					value={value}
					editor={editor}
					onChangeValue={onChangeValue}
					onChangeEditor={onChangeEditor}
					{...inputProps}
					disabled={disabled}
				/>
				{hint && <Field.Hint>{hint}</Field.Hint>}
				{callout && (
					<Margins block='x16'>
						<Callout type='warning'>{callout}</Callout>
					</Margins>
				)}
			</Box>
			{enterpriseCallout && (
				<ExternalLink to={''}>
					<Button>{t('See_Paid_Plan')}</Button>
				</ExternalLink>
			)}
		</Field>
	);
};

export default memo(MemoizedSetting);
