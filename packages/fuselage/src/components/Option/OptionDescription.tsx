import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { ItemDescription } from '../Item';

export type OptionDescriptionProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

const OptionDescription = ({ className, ...props }: OptionDescriptionProps) => (
	<ItemDescription inline {...(props as Omit<OptionDescriptionProps, 'is'>)} className={cx('rcx-option__description', className)} />
);

export default OptionDescription;
