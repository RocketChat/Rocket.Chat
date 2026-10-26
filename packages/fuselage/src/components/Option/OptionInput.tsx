import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { ItemActions } from '../Item';

export type OptionInputProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const OptionInput = ({ className, ...props }: OptionInputProps) => (
	<ItemActions {...(props as Omit<OptionInputProps, 'is'>)} className={cx('rcx-option__input', className)} />
);

export default OptionInput;
