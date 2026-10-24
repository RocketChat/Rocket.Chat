import type { AllHTMLAttributes, CSSProperties } from 'react';

import AvatarContainer, { type AvatarContainerProps } from './AvatarContainer';

export type AvatarProps = AvatarContainerProps & {
	rounded?: boolean;
	objectFit?: CSSProperties['objectFit'];
	url: string;
} & Omit<AllHTMLAttributes<HTMLImageElement>, 'size'>;

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
			<img {...props} src={url} className={innerClass} alt={alt || ''} />
		</AvatarContainer>
	);
};

export default Avatar;
