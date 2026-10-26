import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type ThreadMessageRowProps = HTMLAttributes<HTMLDivElement>;

const ThreadMessageRow = ({ className, ...props }: ThreadMessageRowProps) => (
	<div {...props} className={cx('rcx-box rcx-box--full rcx-message-thread__row', className)} />
);

export default ThreadMessageRow;
