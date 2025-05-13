import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

const messageComposerInputNewStyle = css`
	resize: none;

	&::placeholder {
		color: ${Palette.text['font-annotation']};
	}
`;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface MessageComposerInputNewProps extends ComponentProps<typeof Box> {}

const MessageComposerInputNew = forwardRef<HTMLTextAreaElement, MessageComposerInputNewProps>(function MessageComposerInputNew(props, ref) {
	return (
		<Box is='label' width='full' fontSize={0}>
			<Box
				className={[messageComposerInputNewStyle, 'rc-message-box__divcontenteditable js-input-message']}
				color='default'
				width='full'
				minHeight={20}
				maxHeight={155}
				rows={1}
				fontScale='p2'
				ref={ref}
				pi={12}
				mb={16}
				borderWidth={0}
				is='div'
				contentEditable
				suppressContentEditableWarning
				{...props}
			/>
		</Box>
	);
});

export default MessageComposerInputNew;
