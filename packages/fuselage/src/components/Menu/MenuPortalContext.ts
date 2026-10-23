import type { RefObject } from 'react';
import { createContext, useContext } from 'react';

/**
 * Ref to the root menu popover's portal container.
 *
 * Submenu popovers portal into this container instead of straight into
 * `document.body`, so the whole menu tree lives in a single DOM subtree nested
 * under the root popover. This mirrors `react-aria-components`'
 * `PopoverGroupContext` and is what keeps focus tracking and `aria-hidden`
 * scoping correct across submenu levels — without it each portaled submenu
 * looks like "outside" to the root popover and close-on-blur tears the tree
 * down.
 *
 * `null` means there is no root yet, i.e. the consuming popover IS the root.
 */
export const MenuPortalContext = createContext<RefObject<HTMLElement | null> | null>(null);

export const useMenuPortalContainer = (): RefObject<HTMLElement | null> | null => useContext(MenuPortalContext);
