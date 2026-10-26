import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { ItemMedia } from '../Item';

export type OptionColumnProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

/**
 * A slot of at least 20px for a status, an emoji or a short label. Empty, it lines up rows with and without icons.
 */
const OptionColumn = ({ className, ...props }: OptionColumnProps) => (
	<ItemMedia {...(props as Omit<OptionColumnProps, 'is'>)} className={cx('rcx-option__column', className)} />
);

export default OptionColumn;
