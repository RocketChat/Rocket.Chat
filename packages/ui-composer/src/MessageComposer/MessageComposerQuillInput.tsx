import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement, Ref } from 'react';
import { forwardRef } from 'react';

const messageComposerInputStyle = css`
	resize: none;

	&::placeholder {
		color: ${Palette.text['font-annotation']};
	}
`;

type MessageComposerQuillInputProps = ComponentProps<typeof Box>;

const MessageComposerQuillInput = forwardRef(function MessageComposerQuillInput(
	props: MessageComposerQuillInputProps,
	ref: Ref<HTMLDivElement>,
): ReactElement {
	console.log(props);
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
				// {...props}
			/>
		</Box>
	);
});

export default MessageComposerQuillInput;
