import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

const messageComposerInputStyle = css`
	resize: none;

	&::placeholder {
		color: ${Palette.text['font-annotation']};
	}
`;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface MessageComposerInputProps extends ComponentProps<typeof Box> {}

const MessageComposerInput = forwardRef<HTMLTextAreaElement, MessageComposerInputProps>(function MessageComposerInput(props, ref) {
	return (
		<Box is='label' width='full' fontSize={0}>
			<Box
				className={[messageComposerInputStyle, 'rc-message-box__textarea js-input-message']}
				color='default'
				width='full'
				minHeight='20px'
				maxHeight='155px'
				rows={1}
				fontScale='p2'
				ref={ref}
				pi={12}
				mb={16}
				borderWidth={0}
				is='textarea'
				{...props}
			/>
		</Box>
	);
});

export default MessageComposerInput;
