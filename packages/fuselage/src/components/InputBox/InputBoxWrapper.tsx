import { styled, Text, type GetProps } from '@tamagui/web';

import { InputBoxWrapperContext, inputChrome } from './Input';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderWidth, fontColor, fontScale, size, spacing } from '../../styleTokens';
import type { BoxProps } from '../Box';
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
	alignItems: 'flex-start',
	flexGrow: 1,
	minWidth: size('x144'),
	paddingBlock: spacing('x8'),
	paddingInline: `calc(${spacing('x16')} - ${borderWidth('default')})`,
	verticalAlign: 'baseline',
	wordBreak: 'break-all',
	outlineWidth: 0,

	variants: {
		small: {
			true: {
				alignItems: 'center',
				minWidth: size('x112'),
				maxHeight: size('x28'),
				paddingBlock: spacing('x4'),
				paddingInline: spacing('x8'),
			},
		},
	} as const,
});

export type InputBoxWrapperProps = BoxProps & { small?: boolean };

const InputBoxWrapper = ({ small, ...props }: InputBoxWrapperProps) => (
	<InputBoxWrapperContext.Provider value={true}>
		<InputBoxWrapperFrame
			small={small}
			{...(useTamaguiBoxProps({ animated: true, ...props }, 'rcx-label rcx-input-box__wrapper') as GetProps<typeof InputBoxWrapperFrame>)}
		/>
	</InputBoxWrapperContext.Provider>
);

export default withFuselageProvider(InputBoxWrapper, { takesBoxTransforms: true });
