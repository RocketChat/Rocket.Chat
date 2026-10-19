import { styled, View, type GetProps } from '@tamagui/web';
import { createElement, type ReactNode } from 'react';

import { strokeColors } from '../../Theme';
import { prependClassName } from '../../helpers/prependClassName';
import { prependRcxClassNames } from '../../helpers/prependRcxClassNames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { useArrayLikeClassNameProp } from '../../hooks/useArrayLikeClassNameProp';
import { borderWidth, size, spacing } from '../../styleTokens';
import { Box, type BoxProps } from '../Box';
import { useStylingProps } from '../Box/useStylingProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const dividerSize = toCSSValue('--rcx-divider-size', borderWidth('default')!);
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
		danger: {
			true: {
				borderColor: String(strokeColors['stroke-error']),
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

const DividerWrapper = styled(View, {
	marginBlock: spacing('x8'),
	paddingInline: spacing('x8'),
});

export type DividerProps = BoxProps & {
	variation?: 'danger';
	children?: ReactNode;
	vertical?: boolean;
};

const PlainDivider = ({ variation, vertical, ...props }: Omit<DividerProps, 'children'>) => {
	const { is = 'hr', ...lineProps } = useStylingProps(prependRcxClassNames(useArrayLikeClassNameProp(props)));
	lineProps.className = prependClassName(
		lineProps.className,
		['rcx-divider', vertical && 'rcx-divider--vertical', variation === 'danger' && 'rcx-divider--danger'].filter(Boolean).join(' '),
	);

	return (
		<DividerLine
			render={typeof is === 'string' ? is : (renderProps: Record<string, unknown>) => createElement(is, renderProps)}
			vertical={vertical}
			danger={variation === 'danger'}
			{...(lineProps as GetProps<typeof DividerLine>)}
		/>
	);
};

const Divider = ({ variation, children, vertical, ...props }: DividerProps) => {
	if (!children) {
		return <PlainDivider variation={variation} vertical={vertical} {...props} />;
	}

	return (
		<Box rcx-message-divider role='separator' {...props}>
			<DividerBar className='rcx-divider__bar' />
			<DividerWrapper className='rcx-divider__wrapper'>{children}</DividerWrapper>
			<DividerBar className='rcx-divider__bar' />
		</Box>
	);
};

export default withFuselageProvider(Divider);
