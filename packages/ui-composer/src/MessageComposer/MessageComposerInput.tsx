import { Box, Palette } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';
import type { ComponentProps, ReactElement } from 'react';
import { forwardRef } from 'react';

const messageComposerInputStyle = css`
	resize: none;

	&::placeholder {
		color: ${Palette.text['font-annotation']};
	}
`;

const MessageComposerInput = forwardRef<HTMLInputElement, ComponentProps<typeof Box>>(
	({ className, ...props }, ref): ReactElement => (
		<Box is='label' width='full' fontSize={0}>
			<Box
				color='default'
				width='full'
				minHeight='20px'
				maxHeight='155px'
				rows={1}
				fontScale='p2'
				ref={ref}
				pi={12}
				mb={16}
				{...props}
				borderWidth={0}
				is='textarea'
				className={[messageComposerInputStyle, className]}
			/>
		</Box>
	),
);

export default MessageComposerInput;
