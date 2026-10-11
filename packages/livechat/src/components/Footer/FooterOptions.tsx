import type { ComponentChildren } from 'preact';

import { MenuPopover } from '../Menu';
import OptionsTrigger from './OptionsTrigger';

export type FooterOptionsProps = {
	children: ComponentChildren;
};

const FooterOptions = ({ children }: FooterOptionsProps) => (
	<MenuPopover trigger={OptionsTrigger} overlayed>
		{children}
	</MenuPopover>
);

export default FooterOptions;
