import type { AllHTMLAttributes, CSSProperties } from 'react';

import AvatarContainer, { type AvatarContainerProps } from './AvatarContainer';

export type AvatarProps = AvatarContainerProps & {
	/** Crops the image to a circle instead of a square with rounded corners. */
	rounded?: boolean;
	/** How an image that isn't square fills the avatar; left unset, it is stretched to fit. */
	objectFit?: CSSProperties['objectFit'];
	url: string;
} & Omit<AllHTMLAttributes<HTMLImageElement>, 'size'>;

/** Shows the picture of a single user or entity, such as a room or an app. */
const Avatar = ({ size = 'x36', rounded = false, objectFit, url, className, alt, ...props }: AvatarProps) => {
	const innerClass = [
		'rcx-avatar__element',
		size && `rcx-avatar__element--${size}`,
		rounded && 'rcx-avatar__element--rounded',
		objectFit && `rcx-avatar__element--object-fit-${objectFit}`,
	]
		.filter(Boolean)
		.join(' ');

	return (
		<AvatarContainer size={size} className={className}>
			<img src={url} className={innerClass} alt={alt || ''} {...props} />
		</AvatarContainer>
	);
};

export default Avatar;
