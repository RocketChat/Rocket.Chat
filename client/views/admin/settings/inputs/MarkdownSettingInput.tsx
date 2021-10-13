import { Box, Field, Flex } from '@rocket.chat/fuselage';
import React, { ChangeEvent, FunctionComponent } from 'react';

import MarkdownTextEditor from '../../../../components/MarkdownTextEditor';
import ResetSettingButton from '../ResetSettingButton';

type MarkdownSettingInputProps = {
	value: string;
	onChangeValue: (value: string) => void;
	label: string;
	_id: any;
	hasResetButton: boolean;
	onResetButtonClick: any;
};

const MarkdownSettingInput: FunctionComponent<MarkdownSettingInputProps> = ({
	_id,
	label,
	value,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}) => {
	const handleChange = (result: ChangeEvent<{ value?: string }> | string): void => {
		if (!onChangeValue) {
			return;
		}
		typeof result === 'string'
			? onChangeValue(result)
			: result.target?.value && onChangeValue(result.target.value);
	};

	return (
		<>
			<Flex.Container>
				<Box>
					<Field.Label htmlFor={_id} title={_id}>
						{label}
					</Field.Label>
					{hasResetButton && (
						<ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />
					)}
				</Box>
			</Flex.Container>
			<Field.Row>
				<MarkdownTextEditor value={value} onChange={handleChange} showPlaceholderInput={false} />
			</Field.Row>
		</>
	);
};

export default MarkdownSettingInput;
