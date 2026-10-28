import type { ComponentChildren } from 'preact';
import type { HTMLAttributes } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

export type PopoverOverlayProps = {
	children?: ComponentChildren;
	visible?: boolean;
	className?: string;
	ref?: any; // FIXME: remove this
} & HTMLAttributes<HTMLDivElement>;

const PopoverOverlay = ({ children, className, visible, ...props }: PopoverOverlayProps) => (
	<div className={createClassName(styles, 'popover__overlay', { visible }, [className])} {...props}>
		{children}
	</div>
);

export default PopoverOverlay;
