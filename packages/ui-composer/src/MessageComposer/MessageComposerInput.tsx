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

type MessageComposerInputProps = ComponentProps<typeof Box>;

const MessageComposerInput = forwardRef<HTMLTextAreaElement, MessageComposerInputProps>(function MessageComposerInput(props, ref) {
	return (
		<Box
			className={[messageComposerInputStyle, 'rc-message-box__textarea js-input-message']}
			color='default'
			width='full'
			minHeight={52}
			maxHeight={155}
			rows={1}
			fontScale='p2'
			ref={ref}
			pi={12}
			pb={16}
			borderWidth={0}
			is='textarea'
			dir='auto'
			{...props}
		/>
	);
});

export default MessageComposerInput;
