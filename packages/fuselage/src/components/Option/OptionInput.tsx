import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames.js';
import { ItemActions } from '../Item/index.js';

export type OptionInputProps = {
	children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const OptionInput = ({ className, ...props }: OptionInputProps) => (
	<ItemActions {...props} className={cx('rcx-option__input', className)} />
);

export default OptionInput;
