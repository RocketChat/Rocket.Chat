import { useBorderBoxSize, useButtonPattern } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, AllHTMLAttributes, HTMLAttributeAnchorTarget, MouseEvent } from 'react';
import { useRef, useCallback, useMemo } from 'react';

import { composeClassNames as cx } from '../../helpers/composeClassNames';
import { IconButton } from '../Button';

export type BannerVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const variants: BannerVariant[] = ['neutral', 'info', 'success', 'warning', 'danger'];

export type BannerProps = {
	/** Shows the pointer cursor over the banner, to signal that clicking it calls `onAction`. */
	actionable?: boolean;
	/** Shows a close button that calls `onClose`. */
	closeable?: boolean;
	/** Shown before the content, and hidden when the banner is 375px wide or narrower. */
	icon?: ReactNode;
	/** Puts the title and the content on one line, cutting the content short with an ellipsis. */
	inline?: boolean;
	/** URL of a link shown after the content. */
	link?: string;
	linkTarget?: HTMLAttributeAnchorTarget;
	linkText?: string;
	/** Makes the whole banner a button that calls it on click, Enter or Space. */
	onAction?: () => void;
	onClose?: () => void;
	title?: string;
	/** Colors the top border, the icon and the link by what the banner reports; `neutral` has no colored border. */
	variant?: BannerVariant;
} & AllHTMLAttributes<HTMLElement>;

/**
 * Reports a condition that affects the whole app rather than specific content, such as a lost connection or a blocked
 * permission, at the top of the screen. Whether the user can dismiss it depends on how important it is.
 */
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
		<div
			className={cx('rcx-banner')({ [variant]: true, inline, actionable }, className)}
			ref={ref}
			{...(onAction ? { ...buttonProps } : { role: 'banner', tabIndex: -1 })}
			{...props}
		>
			{icon && isIconVisible && (
				<div
					className={cx(`rcx-banner__icon rcx-banner__icon--${variant}`)({
						inline,
					})}
				>
					{icon}
				</div>
			)}
			<div className={cx('rcx-banner__content')({ inline })}>
				{title && <h6 className={cx('rcx-banner__title')({ inline })}>{title}</h6>}
				{children}
				{link && (
					<a href={link} target={linkTarget} className={cx('rcx-banner__link')({ [variant]: true })}>
						{linkText}
					</a>
				)}
			</div>
			{closeable && (
				<div className={cx('rcx-banner__close-button')({ inline })}>
					<IconButton size='small' onClick={handleCloseButtonClick} icon='cross' />
				</div>
			)}
		</div>
	);
};

export default Banner;
