import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

const RichTextComposerInputStyle = css`
	&::-webkit-scrollbar-thumb {
		background-color: ${Palette.stroke['stroke-dark']};
		border-radius: 4px;
	}
`;

// Links only open on Cmd/Ctrl+click, so the pointer is offered while that modifier is held.
const RichTextComposerLinkModifierStyle = css`
	a:not([href='#']) {
		cursor: pointer;
	}
`;

type RichTextComposerInputProps = ComponentProps<typeof Box> & {
	placeholder?: string;
	hideplaceholder?: boolean;
	hidetext?: boolean;
	linkmodifier?: boolean;
};

const RichTextComposerInput = forwardRef<HTMLDivElement, RichTextComposerInputProps>(function RichTextComposerInput(props, ref) {
	// Supress warnings related to hideplaceholder/hidetext being invalid DOM props.
	// `disabled` is inert on a contenteditable, so it drives contentEditable instead of reaching the DOM.
	const { placeholder, hideplaceholder, hidetext, linkmodifier, disabled, ...rest } = props;

	return (
		<Box is='div' width='full' style={hidetext ? { visibility: 'hidden' } : undefined}>
			<Box
				className={['rc-message-box__placeholder']}
				color='font-annotation'
				width='full'
				minHeight={20}
				maxHeight={155}
				fontScale='p2'
				paddingInline={12}
				marginBlock={16}
				borderWidth={0}
				is='div'
				style={{
					position: 'absolute',
					pointerEvents: 'none',
					opacity: hideplaceholder ? 0 : 1,
				}}
			>
				{placeholder}
			</Box>
			<Box
				className={[
					RichTextComposerInputStyle,
					...(linkmodifier ? [RichTextComposerLinkModifierStyle] : []),
					'rc-message-box__divcontenteditable js-input-message',
				]}
				color='default'
				width='full'
				minHeight={20}
				maxHeight={155}
				fontScale='p2'
				ref={ref}
				paddingInline={12}
				paddingBlock={16}
				borderWidth={0}
				is='span'
				contentEditable={!disabled}
				aria-disabled={disabled}
				suppressContentEditableWarning
				style={{
					display: 'block',
					whiteSpace: 'pre-wrap',
					cursor: disabled ? 'default' : 'text',
					overflowY: 'scroll',
				}}
				{...rest}
			/>
		</Box>
	);
});

export default RichTextComposerInput;
