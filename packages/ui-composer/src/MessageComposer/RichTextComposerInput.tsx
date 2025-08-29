import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

const RichTextComposerInputStyle = css`
	resize: none;

	&::-webkit-scrollbar-thumb {
		background-color: ${Palette.stroke['stroke-dark']};
		border-radius: 4px;
	}
`;

type RichTextComposerInputProps = ComponentProps<typeof Box> & {
	placeholder?: string;
	hideplaceholder?: boolean;
};

const RichTextComposerInput = forwardRef<HTMLDivElement, RichTextComposerInputProps>(function RichTextComposerInput(props, ref) {
	// The whitespace pre-wrap style is passed into the div contenteditable as without it, additional whitespace gets collapsed
	// This would then interfere with .innerText a LOT and should now be fixed

	// Supress warnings related to hideplaceholder being invalid DOM prop
	const { placeholder, hideplaceholder, ...rest } = props;

	return (
		<Box is='div' width='full'>
			<Box
				className={['rc-message-box__placeholder']}
				color='font-annotation'
				width='full'
				minHeight={20}
				maxHeight={155}
				rows={1}
				fontScale='p2'
				pi={12}
				mb={16}
				borderWidth={0}
				is='div'
				style={{
					position: 'absolute',
					pointerEvents: 'none',
					opacity: hideplaceholder ? 0 : 1,
				}}
				{...rest}
			>
				{placeholder}
			</Box>
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
				pb={16}
				borderWidth={0}
				is='span'
				contentEditable
				suppressContentEditableWarning
				style={{
					display: 'block',
					whiteSpace: 'pre-wrap',
					cursor: 'text',
					overflowY: 'scroll',
				}}
				{...rest}
			/>
		</Box>
	);
});

export default RichTextComposerInput;
