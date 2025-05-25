import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

const RichTextComposerInputStyle = css`
	resize: none;

	&::placeholder {
		color: ${Palette.text['font-annotation']};
	}
`;

type RichTextComposerInputProps = ComponentProps<typeof Box>;

const RichTextComposerInput = forwardRef<HTMLTextAreaElement, RichTextComposerInputProps>(function RichTextComposerInput(props, ref) {
	// The whitespace pre-wrap style is passed into the div contenteditable as without it, additional whitespace gets collapsed
	// This would then interferes with .innerText a LOT and should now be fixed
	return (
		<Box is='label' width='full' fontSize={0}>
			<Box
				className={[RichTextComposerInputStyle, 'rc-message-box__divcontenteditable js-input-message']}
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
				style={{ whiteSpace: 'pre-wrap' }}
				{...props}
			/>
		</Box>
	);
});

export default RichTextComposerInput;
