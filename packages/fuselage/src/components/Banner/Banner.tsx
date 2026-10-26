import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, AllHTMLAttributes, HTMLAttributeAnchorTarget, MouseEvent } from 'react';
import { useCallback } from 'react';

import { composeClassNames as cx } from '../../helpers/composeClassNames';
import { IconButton } from '../Button';

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
			{...(onAction ? { ...buttonProps } : { role: 'banner', tabIndex: -1 })}
			{...props}
		>
			{icon && (
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
					<IconButton small onClick={handleCloseButtonClick} icon='cross' />
				</div>
			)}
		</div>
	);
};

export default Banner;
