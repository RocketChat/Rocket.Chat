import { css } from '@rocket.chat/css-in-js';
import { IconButton, TextInput } from '@rocket.chat/fuselage';
import type { FocusEvent, FormEvent } from 'react';
import React from 'react';

type DialPadInputProps = {
	value: string;
	readOnly?: boolean;
	onBackpaceClick?: () => void;
	onChange: (e: FormEvent<HTMLInputElement>) => void;
	onBlur?: (event: FocusEvent<HTMLElement, Element>) => void;
};

const className = css`
	padding-block: 6px;
	min-height: 28px;
	height: 28px;
`;

export const DialPadInput = ({ readOnly, value, onChange, onBackpaceClick }: DialPadInputProps) => {
	return (
		<TextInput
			p={0}
			readOnly={readOnly}
			height='100%'
			minHeight={0}
			value={value}
			className={className}
			addon={<IconButton small icon='backspace' size='14px' disabled={!value} onClick={onBackpaceClick} />}
			onChange={onChange}
		/>
	);
};
