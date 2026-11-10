import type { HTMLAttributes } from 'react';

import { prependClassName } from '../../helpers/prependClassName';

export type AvatarContainerProps = {
	size?: 'x16' | 'x18' | 'x20' | 'x24' | 'x28' | 'x32' | 'x36' | 'x40' | 'x48' | 'x124' | 'x200' | 'x332';
} & HTMLAttributes<HTMLElement>;

const AvatarContainer = ({ size = 'x36', children, ...props }: AvatarContainerProps) => {
	props.className = prependClassName(
		props.className,
		['rcx-box rcx-box--full rcx-avatar', size && `rcx-avatar--${size}`].filter(Boolean).join(' '),
	);

	return <figure {...props}>{children}</figure>;
};

export default AvatarContainer;
