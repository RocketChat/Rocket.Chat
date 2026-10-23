import { css } from '@rocket.chat/css-in-js';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { styled, Text, View, type GetProps, type TamaguiElement } from '@tamagui/web';
import type { ReactNode, RefObject } from 'react';

import { statusColors, surfaceColors, textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { useStyle } from '../../hooks/useStyle';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderRadius, borderWidth, fontFamily, fontScale, spacing } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { Icon, type IconProps } from '../Icon';

export type CalloutProps = ElementProps<HTMLElement> & {
	type?: 'info' | 'success' | 'warning' | 'danger';
	title?: ReactNode;
	children?: ReactNode;
	icon?: IconProps['name'];
	actions?: ReactNode;
};

const WRAPPER_LIMIT_SIZE = 420;

const calloutColors = {
	default: toCSSValue('--rcx-callout-default-color', textIconColors['font-secondary-info']),
	info: toCSSValue('--rcx-callout-info-color', statusColors['status-font-on-info']),
	success: toCSSValue('--rcx-callout-success-color', statusColors['status-font-on-success']),
	warning: toCSSValue('--rcx-callout-warning-color', statusColors['status-font-on-warning']),
	danger: toCSSValue('--rcx-callout-danger-color', statusColors['status-font-on-danger']),
};

const CalloutFrame = styled(View, {
	render: 'section',
	flexDirection: 'row',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	padding: spacing('x12'),
	color: toCSSValue('--rcx-callout-text-color', textIconColors['font-default']),
	borderWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: calloutColors.default,
	borderRadius: toCSSValue('--rcx-callout-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium'))),
	backgroundColor: toCSSValue('--rcx-callout-background-color', surfaceColors['surface-light']),
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',

	variants: {
		type: {
			info: { borderColor: calloutColors.info },
			success: { borderColor: calloutColors.success },
			warning: { borderColor: calloutColors.warning },
			danger: { borderColor: calloutColors.danger },
		},
	} as const,
});

const CalloutWrapper = styled(View, {
	display: 'block',
	overflow: 'hidden',
	justifyContent: 'space-between',
	flexGrow: 1,
	flexShrink: 1,
	flexBasis: 0,
	minWidth: 'auto',
	minHeight: 'auto',
	marginInlineStart: spacing('x12'),

	variants: {
		large: {
			true: {
				display: 'flex',
				flexDirection: 'row',
				alignItems: 'center',
			},
		},
	} as const,
});

const CalloutWrapperContent = styled(View, {
	overflow: 'hidden',
	flexShrink: 1,
});

const CalloutTitle = styled(Text, {
	render: 'div',
	display: 'block',
	whiteSpace: 'nowrap',
	wordWrap: 'normal',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	...(fontScale('p2b') as object),
});

const CalloutContent = styled(Text, {
	render: 'div',
	display: 'block',
	whiteSpace: 'normal',
	wordWrap: 'normal',
	...(fontScale('p2') as object),

	variants: {
		afterTitle: {
			true: { marginBlockStart: spacing('x4') },
		},
	} as const,
});

const CalloutActions = styled(View, {
	display: 'block',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	marginBlockStart: spacing('x12'),

	variants: {
		large: {
			true: { marginBlockStart: 0 },
		},
	} as const,
});

/**
 * The `Callout` is used to get the user's attention explaining something important in the content of the current page.
 */
const Callout = ({ type, title, children, icon, actions, ...props }: CalloutProps) => {
	const { ref, borderBoxSize } = useResizeObserver();
	const isLarge = !!borderBoxSize.inlineSize && borderBoxSize.inlineSize >= WRAPPER_LIMIT_SIZE;

	const iconColorClassName = useStyle(
		type
			? css`
					color: ${calloutColors[type]};
				`
			: undefined,
	);

	const frameProps = useTamaguiBoxProps(props, ['rcx-callout', type && `rcx-callout--${type}`].filter(Boolean).join(' '));

	const defaultIcon =
		(type === 'info' && 'info-circled') ||
		(type === 'success' && 'checkmark-circled') ||
		(type === 'warning' && 'warning') ||
		(type === 'danger' && 'ban') ||
		'info-circled';

	return (
		<CalloutFrame ref={ref as RefObject<TamaguiElement>} type={type} {...(frameProps as GetProps<typeof CalloutFrame>)}>
			<Icon className={['rcx-callout__icon', iconColorClassName].filter(Boolean).join(' ')} name={icon || defaultIcon} size='x20' />
			<CalloutWrapper large={isLarge} className={isLarge ? 'rcx-callout__wrapper rcx-callout__wrapper--large' : 'rcx-callout__wrapper'}>
				<CalloutWrapperContent className='rcx-callout__wrapper-content'>
					{title && <CalloutTitle className='rcx-callout__title'>{title}</CalloutTitle>}
					{children && (
						<CalloutContent afterTitle={!!title} className='rcx-callout__content'>
							{children}
						</CalloutContent>
					)}
				</CalloutWrapperContent>
				{actions && (
					<CalloutActions large={isLarge} className='rcx-callout__actions'>
						{actions}
					</CalloutActions>
				)}
			</CalloutWrapper>
		</CalloutFrame>
	);
};

export default withFuselageProvider(Callout, { takesBoxTransforms: true });
