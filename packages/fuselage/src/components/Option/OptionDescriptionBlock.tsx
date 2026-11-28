import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type OptionDescriptionBlockProps = {
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const OptionDescriptionBlock = ({ className, ...props }: OptionDescriptionBlockProps) => (
	<div {...props} className={cx('rcx-option__description-block', className)} />
);

export default OptionDescriptionBlock;
