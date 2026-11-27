import type { KeyboardEvent, MouseEvent } from 'react';

import type { IconContract } from './Icon.contract';
import type { WebProps } from '../../types/WebAttributes';

export type { IconColor, IconContract, IconSize } from './Icon.contract';

/** The contract as the web renderer takes it, with what only an element of a page has. */
export type IconProps = WebProps<IconContract, HTMLElement> & {
	title?: string;
	onClick?: (event: MouseEvent<HTMLElement>) => void;
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
	onMouseEnter?: (event: MouseEvent<HTMLElement>) => void;
};

export { default } from './Icon.web';
