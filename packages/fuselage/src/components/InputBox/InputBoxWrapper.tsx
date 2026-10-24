import { styled, Text, type GetProps } from '@tamagui/web';
import type { LabelHTMLAttributes } from 'react';

import { InputBoxWrapperContext, inputChrome } from './Input';
import { borderWidth, fontColor, fontScale, size, spacing } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { labelBoxDefaults } from '../Label/Label';

const p2m = fontScale('p2m');

// The wrapper used to render as `Label`, so it keeps the `Label` styles the input box did not override
const InputBoxWrapperFrame = styled(Text, {
	render: 'label',
	...labelBoxDefaults,
	letterSpacing: p2m.letterSpacing,
	fontSize: p2m.fontSize,
	fontWeight: p2m.fontWeight as 500,
	lineHeight: p2m.lineHeight,
	cursor: 'default',
	color: fontColor('default'),

	...inputChrome,
	position: 'relative',
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'nowrap',
	// Centred on the 40px row it always holds an input for, as `:has(> .rcx-input-box)` did
	alignItems: 'center',
	flexGrow: 1,
	minWidth: size('x144'),
	minHeight: size('x40'),
	paddingBlock: spacing('x8'),
	paddingInline: `calc(${spacing('x16')} - ${borderWidth('default')})`,
	verticalAlign: 'baseline',
	wordBreak: 'break-all',
	outlineWidth: 0,

	variants: {
		endAddonFlush: {
			true: {
				paddingBlock: spacing('x4'),
				paddingInlineEnd: spacing('x4'),
			},
		},
		textarea: {
			true: { alignItems: 'flex-start' },
		},
		small: {
			true: {
				alignItems: 'center',
				minWidth: size('x112'),
				minHeight: size('x28'),
				maxHeight: size('x28'),
				paddingBlock: spacing('x4'),
				paddingInline: spacing('x8'),
			},
		},
		invisible: {
			true: { visibility: 'hidden', opacity: 0 },
		},
	} as const,
});

export type InputBoxWrapperProps = ElementProps<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>> & {
	invisible?: boolean;
	small?: boolean;
	textarea?: boolean;
	endAddonFlush?: boolean;
};

const InputBoxWrapper = ({ small, textarea, endAddonFlush, invisible, className, ...props }: InputBoxWrapperProps) => (
	<InputBoxWrapperContext.Provider value={true}>
		<InputBoxWrapperFrame
			endAddonFlush={endAddonFlush}
			textarea={textarea}
			small={small}
			invisible={invisible}
			className={[
				'rcx-label rcx-input-box__wrapper rcx-box--animated',
				endAddonFlush && 'rcx-input-box__wrapper--end-addon-flush',
				className,
			]
				.filter(Boolean)
				.join(' ')}
			{...(props as GetProps<typeof InputBoxWrapperFrame>)}
		/>
	</InputBoxWrapperContext.Provider>
);

export default withFuselageProvider(InputBoxWrapper);
