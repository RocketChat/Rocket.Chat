import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type ThreadMessageLeftContainerProps = HTMLAttributes<HTMLDivElement>;

const ThreadMessageLeftContainer = ({ className, ...props }: ThreadMessageLeftContainerProps) => (
	<div {...props} className={cx('rcx-box rcx-box--full rcx-message-container rcx-message-container--left', className)} />
);

export default ThreadMessageLeftContainer;
