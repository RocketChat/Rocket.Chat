import { Box, Palette } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import type { ComponentProps, ReactElement } from 'react';
import { forwardRef } from 'react';

const messageComposerInputStyle = css`
	overflow-y: auto;

	width: 100%;
	height: 23px;

	min-height: 23px;
	max-height: 155px;
	padding: 0;

	resize: none;

	color: ${Palette.text['font-default']};
	border: 0;
	background-color: transparent;

	font-family: inherit;
	font-size: var(--message-box-text-size);

	line-height: 21px;

	&::placeholder {
		color: var(--message-box-placeholder-color);
	}
`;

const MessageComposerInput = forwardRef<HTMLInputElement, ComponentProps<typeof Box>>(
	(props, ref): ReactElement => (
		<Box is='label' width='full' fontSize={0}>
			<Box
				minHeight='20px'
				rows={1}
				fontScale='p2'
				ref={ref}
				pi={12}
				mb={16}
				{...props}
				borderWidth={0}
				is='textarea'
				className={[messageComposerInputStyle]}
			/>
		</Box>
	),
);

export default MessageComposerInput;
