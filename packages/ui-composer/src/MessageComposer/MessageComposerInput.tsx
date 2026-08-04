import { css } from '@rocket.chat/css-in-js';
import type { BoxProps } from '@rocket.chat/fuselage';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { RefAttributes } from 'react';

const messageComposerInputStyle = css`
	resize: none;

	&::placeholder {
		color: ${Palette.text['font-annotation']};
	}
`;

export type MessageComposerInputProps = BoxProps & RefAttributes<HTMLTextAreaElement>;

const MessageComposerInput = ({ ref, ...props }: MessageComposerInputProps) => {
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
			paddingInline={12}
			paddingBlock={16}
			borderWidth={0}
			is='textarea'
			{...props}
		/>
	);
};

export default MessageComposerInput;
