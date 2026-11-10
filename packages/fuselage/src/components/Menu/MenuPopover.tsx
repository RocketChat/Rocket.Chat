import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { AriaPopoverProps } from 'react-aria';
import { useInteractOutside } from 'react-aria';
import type { OverlayTriggerState } from 'react-stately';

import { Box } from '../Box';
import { DropdownDesktop } from '../Dropdown/DropdownDesktop';
import { DropdownMobile } from '../Dropdown/DropdownMobile';
import { Popover } from '../Popover';
import { MenuPortalContext, useMenuPortalContainer } from './MenuPortalContext';

type MenuPopoverProps = Omit<AriaPopoverProps, 'popoverRef'> & {
	children: ReactNode;
	state: OverlayTriggerState;
	maxWidth?: string;
};

function MenuPopover({ children, state, offset = 4, maxWidth, ...props }: MenuPopoverProps) {
	const isMobile = !useBreakpoints().includes('sm');

	// The root popover (no container above it) renders a `display: contents`
	// mount point and shares it with the rest of the tree. Submenu popovers
	// portal into it, so their DOM nests under the root popover and the whole
	// tree behaves as one for focus/`aria-hidden` purposes — matching how
	// `react-aria-components` groups submenu popovers via `PopoverGroupContext`.
	const groupContainer = useMenuPortalContainer();
	const containerRef = useRef<HTMLDivElement>(null);
	const isSubmenu = groupContainer !== null;

	const popoverRef = useRef<HTMLDivElement>(null);

	// react-aria only lets the *topmost* overlay dismiss on an outside click.
	// While a submenu is open it is topmost, but submenus are non-modal (hence
	// non-dismissable), so neither the submenu nor the root closes. Since every
	// open submenu portals into the root popover, the root popover element
	// contains the entire menu tree — so we close the whole menu on any
	// interaction outside it (ignoring the trigger, which toggles on its own).
	useInteractOutside({
		ref: popoverRef,
		isDisabled: isSubmenu,
		onInteractOutside: (event) => {
			const trigger = props.triggerRef?.current;
			if (trigger && trigger.contains(event.target as Node)) {
				return;
			}
			state.close();
		},
	});

	const popover = (
		<Popover
			state={state}
			offset={offset}
			popoverRef={popoverRef}
			{...props}
			portalContainer={isSubmenu ? (groupContainer?.current ?? undefined) : undefined}
		>
			{isMobile ? (
				<DropdownMobile>{children}</DropdownMobile>
			) : (
				<Box maxWidth={maxWidth}>
					<DropdownDesktop maxHeight='most-of-screen'>{children}</DropdownDesktop>
				</Box>
			)}
			{!isSubmenu && <span ref={containerRef} style={{ display: 'contents' }} />}
		</Popover>
	);

	if (isSubmenu) {
		return popover;
	}

	return <MenuPortalContext.Provider value={containerRef}>{popover}</MenuPortalContext.Provider>;
}

export default MenuPopover;
