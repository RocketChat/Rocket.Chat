import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { ItemMedia } from '../Item';

export type OptionAvatarProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const OptionAvatar = ({ className, ...props }: OptionAvatarProps) => (
	<ItemMedia {...(props as Omit<OptionAvatarProps, 'is'>)} className={cx('rcx-option__avatar', className)} />
);

export default OptionAvatar;
