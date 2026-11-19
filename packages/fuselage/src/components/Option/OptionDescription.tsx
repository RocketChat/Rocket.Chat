import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames.js';
import { ItemDescription } from '../Item/index.js';

export type OptionDescriptionProps = {
	children?: ReactNode;
} & Omit<HTMLAttributes<HTMLSpanElement>, 'is'>;

const OptionDescription = ({ className, ...props }: OptionDescriptionProps) => (
	<ItemDescription inline {...props} className={cx('rcx-option__description', className)} />
);

export default OptionDescription;
