import { useBorderBoxSize, useButtonPattern } from '@rocket.chat/fuselage-hooks';
import { styled, Text, View, type GetProps, type TamaguiElement } from '@tamagui/web';
import type { ReactNode, AllHTMLAttributes, HTMLAttributeAnchorTarget, MouseEvent, RefObject } from 'react';
import { useRef, useCallback, useMemo } from 'react';

import { statusColors, strokeColors, surfaceColors, textIconColors } from '../../Theme';
import { composeClassNames as cx } from '../../helpers/composeClassNames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderWidth, fontFamily, fontScale } from '../../styleTokens';
import { IconButton } from '../Button';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type BannerVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const variants: BannerVariant[] = ['neutral', 'info', 'success', 'warning', 'danger'];

export type BannerProps = {
	actionable?: boolean;
	closeable?: boolean;
	icon?: ReactNode;
	inline?: boolean;
	link?: string;
	linkTarget?: HTMLAttributeAnchorTarget;
	linkText?: string;
	onAction?: () => void;
	onClose?: () => void;
	title?: string;
	variant?: BannerVariant;
} & AllHTMLAttributes<HTMLElement>;

const bannerColors = {
	info: toCSSValue('--rcx-banner-colors-info-color', statusColors['status-font-on-info']),
	success: toCSSValue('--rcx-banner-colors-success-color', statusColors['status-font-on-success']),
	warning: toCSSValue('--rcx-banner-colors-warning-color', statusColors['status-font-on-warning']),
	danger: toCSSValue('--rcx-banner-colors-danger-color', statusColors['status-font-on-danger']),
};

const BannerFrame = styled(View, {
	flexDirection: 'row',
	flexWrap: 'nowrap',
	justifyContent: 'space-between',
	alignItems: 'flex-start',
	flexGrow: 0,
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	paddingBlock: 14,
	paddingInline: 16,
	color: toCSSValue('--rcx-banner-colors-neutral-color', textIconColors['font-default']),
	borderTopWidth: borderWidth('large'),
	borderTopStyle: 'solid',
	borderBottomWidth: borderWidth('default'),
	borderBottomStyle: 'solid',
	borderBottomColor: String(strokeColors['stroke-extra-light']),
	backgroundColor: toCSSValue('--rcx-banner-colors-neutral-background-color', surfaceColors['surface-tint']),
	fontFamily: fontFamily('sans'),

	variants: {
		kind: {
			neutral: { borderTopColor: 'transparent' },
			info: { borderTopColor: bannerColors.info },
			success: { borderTopColor: bannerColors.success },
			warning: { borderTopColor: bannerColors.warning },
			danger: { borderTopColor: bannerColors.danger },
		},
		inline: {
			true: { paddingBlock: 12 },
		},
		actionable: {
			true: { cursor: 'pointer' },
		},
	} as const,
});

const BannerIcon = styled(View, {
	display: 'block',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	boxSizing: 'content-box',
	paddingBlock: 8,
	paddingInlineEnd: 12,

	// No `inline` variant: the icon's modifier class composes as `rcx-banner__icon--<variant>--inline`, which no rule ever matched
	variants: {
		kind: {
			neutral: {},
			info: { color: bannerColors.info },
			success: { color: bannerColors.success },
			warning: { color: bannerColors.warning },
			danger: { color: bannerColors.danger },
		},
	} as const,
});

const BannerContent = styled(Text, {
	render: 'div',
	display: 'block',
	whiteSpace: 'normal',
	wordWrap: 'normal',
	boxSizing: 'content-box',
	flexGrow: 1,
	alignSelf: 'center',
	...(fontScale('p2') as object),

	variants: {
		inline: {
			true: {
				overflow: 'hidden',
				textOverflow: 'ellipsis',
				whiteSpace: 'nowrap',
			},
		},
	} as const,
});

const BannerTitle = styled(Text, {
	render: 'h6',
	display: 'block',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	boxSizing: 'content-box',
	margin: 0,
	padding: 0,
	...(fontScale('h5') as object),

	variants: {
		inline: {
			true: {
				display: 'inline',
				paddingInlineEnd: 8,
			},
		},
	} as const,
});

const BannerLink = styled(Text, {
	render: 'a',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	boxSizing: 'content-box',
	paddingLeft: 10,
});

const BannerCloseButton = styled(View, {
	display: 'block',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	boxSizing: 'content-box',
	paddingBlock: 6,
	paddingInline: 8,

	variants: {
		inline: {
			true: { marginBlock: -4, paddingBlock: 0 },
		},
	} as const,
});

const Banner = ({
	actionable,
	children,
	className,
	closeable,
	icon,
	inline = false,
	link,
	linkText = 'More info',
	linkTarget = '_blank',
	onAction,
	onClose,
	title,
	variant = 'neutral',
	...props
}: BannerProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const { inlineSize } = useBorderBoxSize(ref, {
		debounceDelay: 70,
	});

	const isIconVisible = useMemo(() => inlineSize > 375, [inlineSize]);

	variant = variants.includes(variant) ? variant : variants[0];

	const handleBannerClick = useCallback(() => {
		if (onAction) {
			onAction();
		}
	}, [onAction]);

	const handleCloseButtonClick = useCallback(
		(event: MouseEvent) => {
			event.stopPropagation();

			if (onClose) {
				onClose();
			}
		},
		[onClose],
	);

	const buttonProps = useButtonPattern(handleBannerClick);

	return (
		<BannerFrame
			kind={variant}
			inline={inline}
			actionable={actionable}
			className={cx('rcx-banner')({ [variant]: true, inline, actionable }, className)}
			ref={ref as RefObject<TamaguiElement | null>}
			{...((onAction ? { ...buttonProps } : { role: 'banner', tabIndex: -1 }) as GetProps<typeof BannerFrame>)}
			{...(props as GetProps<typeof BannerFrame>)}
		>
			{icon && isIconVisible && (
				<BannerIcon
					kind={variant}
					className={cx(`rcx-banner__icon rcx-banner__icon--${variant}`)({
						inline,
					})}
				>
					{icon}
				</BannerIcon>
			)}
			<BannerContent inline={inline} className={cx('rcx-banner__content')({ inline })}>
				{title && (
					<BannerTitle inline={inline} className={cx('rcx-banner__title')({ inline })}>
						{title}
					</BannerTitle>
				)}
				{children}
				{link && (
					<BannerLink
						{...({ href: link, target: linkTarget } as GetProps<typeof BannerLink>)}
						className={cx('rcx-banner__link')({ [variant]: true })}
					>
						{linkText}
					</BannerLink>
				)}
			</BannerContent>
			{closeable && (
				<BannerCloseButton inline={inline} className={cx('rcx-banner__close-button')({ inline })}>
					<IconButton small onClick={handleCloseButtonClick} icon='cross' />
				</BannerCloseButton>
			)}
		</BannerFrame>
	);
};

export default withFuselageProvider(Banner);
