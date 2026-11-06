import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { ItemMedia } from '../Item';

export type OptionAvatarProps = {
	children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const OptionAvatar = ({ className, ...props }: OptionAvatarProps) => (
	<ItemMedia {...props} className={cx('rcx-option__avatar', className)} />
);

export default OptionAvatar;
