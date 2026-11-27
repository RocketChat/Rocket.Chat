import type { ItemPartContract } from './Item.contract';
import type { WebRowHandlers } from '../../helpers/pickWebRowHandlers';
import type { WebAnchorAttributes, WebElementProps } from '../../types/WebElementAttributes';

export type { ItemInset } from './Item.contract';

/** A part's contract as the web renderer takes it. */
export type ItemPartProps<TContract> = WebElementProps<TContract>;

/** What a part of an `Item` forwards to its element besides its own variations. */
export type ItemPartAttributes = ItemPartProps<ItemPartContract>;

/**
 * What an `Item` forwards to its element, and what a row built on it takes: the handlers a listbox option, a menu item
 * and a draggable row are handed, the address of a row that is a link and the value of an option.
 */
export type ItemAttributes = ItemPartAttributes &
	WebRowHandlers<HTMLElement> &
	WebAnchorAttributes & {
		value?: string | number;
	};
