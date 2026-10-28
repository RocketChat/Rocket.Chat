import type { ComponentChildren } from 'preact';

import PopoverMenuWrapper from './PopoverMenuWrapper';
import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';
import { PopoverTrigger } from '../Popover';

type PopoverMenuProps = {
	children?: ComponentChildren;
	trigger: (contextValue: { pop: () => void }) => ComponentChildren;
	overlayed?: boolean;
};

const MenuPopover = ({ children = null, trigger, overlayed }: PopoverMenuProps) => (
	<PopoverTrigger
		overlayProps={{
			className: overlayed ? createClassName(styles, 'popover-menu__overlay') : null,
		}}
	>
		{trigger}
		{({ dismiss, triggerBounds, overlayBounds }) => (
			<PopoverMenuWrapper dismiss={dismiss} triggerBounds={triggerBounds} overlayBounds={overlayBounds}>
				{children}
			</PopoverMenuWrapper>
		)}
	</PopoverTrigger>
);

export default MenuPopover;
