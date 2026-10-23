import { styled, Text, View, type GetProps } from '@tamagui/web';
import type { ReactNode } from 'react';

import { strokeColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderWidth, size, spacing } from '../../styleTokens';
import { Box, type BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const dividerSize = toCSSValue('--rcx-divider-size', borderWidth('default'));
const dividerColor = toCSSValue('--rcx-divider-color', strokeColors['stroke-extra-light']);

const DividerLine = styled(View, {
	render: 'hr',
	marginBlock: spacing('x8'),
	marginInline: 0,
	borderWidth: 0,
	borderTopWidth: dividerSize,
	borderStyle: 'solid',
	borderColor: dividerColor,

	variants: {
		vertical: {
			true: {
				width: 0,
				height: size('x20'),
				marginBlock: 0,
				marginInline: spacing('x8'),
				borderTopWidth: 0,
				borderLeftWidth: dividerSize,
			},
		},
		small: {
			true: { marginInline: spacing('x4') },
		},
		stretch: {
			true: { alignSelf: 'stretch', height: 'auto' },
		},
		flush: {
			true: { marginBlock: 0, marginInline: 0 },
		},
		danger: {
			true: {
				borderColor: String(strokeColors['stroke-error']),
			},
		},
		light: {
			true: {
				borderColor: String(strokeColors['stroke-light']),
			},
		},
	} as const,
});

const DividerBar = styled(View, {
	flexGrow: 1,
	borderWidth: dividerSize,
	borderStyle: 'solid',
	borderColor: dividerColor,
});

const DividerWrapper = styled(Text, {
	render: 'div',
	display: 'block',
	whiteSpace: 'inherit',
	marginBlock: spacing('x8'),
	paddingInline: spacing('x8'),
});

export type DividerProps = BoxProps & {
	variation?: 'danger' | 'light';
	children?: ReactNode;
	vertical?: boolean;
	/** Removes the divider's own margin, leaving the spacing to its container. */
	flush?: boolean;
	/** Uses a 4px inline margin on a vertical divider instead of 8px. */
	small?: boolean;
	/** Makes a vertical divider as tall as its container instead of 20px. */
	stretch?: boolean;
};

const PlainDivider = ({ variation, vertical, flush, small, stretch, ...props }: Omit<DividerProps, 'children'>) => {
	const lineProps = useTamaguiBoxProps(
		props,
		[
			'rcx-divider',
			vertical && 'rcx-divider--vertical',
			vertical && small && 'rcx-divider--small',
			vertical && stretch && 'rcx-divider--stretch',
			flush && 'rcx-divider--flush',
			variation === 'danger' && 'rcx-divider--danger',
			variation === 'light' && 'rcx-divider--light',
		]
			.filter(Boolean)
			.join(' '),
	);

	return (
		<DividerLine
			vertical={vertical}
			small={vertical && small}
			stretch={vertical && stretch}
			flush={flush}
			danger={variation === 'danger'}
			light={variation === 'light'}
			{...(lineProps as GetProps<typeof DividerLine>)}
		/>
	);
};

const Divider = ({ variation, children, vertical, flush, small, stretch, ...props }: DividerProps) => {
	if (!children) {
		return <PlainDivider variation={variation} vertical={vertical} flush={flush} small={small} stretch={stretch} {...props} />;
	}

	return (
		<Box rcx-message-divider rcx-divider--labelled role='separator' {...props}>
			<DividerBar className='rcx-divider__bar' />
			<DividerWrapper className='rcx-divider__wrapper'>{children}</DividerWrapper>
			<DividerBar className='rcx-divider__bar' />
		</Box>
	);
};

export default withFuselageProvider(Divider, { takesBoxTransforms: true });
