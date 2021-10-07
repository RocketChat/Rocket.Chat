import { Box, Field, Flex } from '@rocket.chat/fuselage';
import React, { ChangeEvent, FunctionComponent } from 'react';

import MarkdownTextEditor from '../../../../../ee/client/omnichannel/components/CannedResponse/MarkdownTextEditor';
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
	const handleChange = (event: ChangeEvent<{ value?: string }>): void => {
		console.log(event);
		onChangeValue && event.target?.value && onChangeValue(event.target.value);
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
				<MarkdownTextEditor value={value} onChange={handleChange} />
			</Field.Row>
		</>
	);
};

export default MarkdownSettingInput;
