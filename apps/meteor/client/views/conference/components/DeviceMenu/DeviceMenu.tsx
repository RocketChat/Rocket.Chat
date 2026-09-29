import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Dropdown, Icon } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useDropdownVisibility } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useCallback } from 'react';

import { DeviceMenuContext } from './DeviceMenuContext';

/**
 * The device on the left, its name beside it, the chevron pushed to the far right — a control that says what it
 * is, what it is set to, and that there is more behind it, read left to right.
 *
 * Built on a plain button rather than `GenericMenu` because that one clones its trigger: it injects its own
 * chevron as a *leading* icon and replaces the button's `className`, so neither the icon's place nor the name's
 * alignment was ours to set. Owning the open state is also what lets the chevron turn over when it opens.
 */
const triggerStyles = css`
	width: 100%;
	min-width: 0;

	& > .rcx-button--content {
		display: flex;
		width: 100%;
		min-width: 0;
		align-items: center;
		justify-content: flex-start;
		gap: 6px;
	}
`;

const nameStyles = css`
	overflow: hidden;
	flex-grow: 1;
	text-align: left;
	white-space: nowrap;
	text-overflow: ellipsis;
`;

export type DeviceMenuProps = {
	icon: IconName;
	label: string;
	/** The name of what the device is set to; the label stands in while there is none. */
	current?: string;
	disabled: boolean;
	/** The options, and the sections of choices about the device under them. */
	children: ReactNode;
};

/**
 * A dropdown for choosing one device on the preflight, and what is done to it.
 *
 * Separate from the in-call pickers on purpose: those switch a device mid-call through the call's own contexts, and
 * there is no call here yet. This only records a choice for the join to carry.
 */
const DeviceMenu = ({ icon, label, current, disabled, children }: DeviceMenuProps) => {
	const { isVisible, toggle, reference, target } = useDropdownVisibility<HTMLButtonElement, HTMLElement>();
	const close = useCallback(() => toggle(false), [toggle]);

	return (
		<Box display='flex' alignItems='center' minWidth={0}>
			<Button
				ref={reference}
				small
				className={triggerStyles}
				aria-label={label}
				aria-haspopup='listbox'
				aria-expanded={isVisible}
				title={current || label}
				disabled={disabled}
				onClick={() => toggle()}
			>
				<Icon name={icon} size='x16' flexShrink={0} />
				<Box className={nameStyles}>{current || label}</Box>
				<Icon name={isVisible ? 'chevron-up' : 'chevron-down'} size='x16' flexShrink={0} />
			</Button>

			{isVisible && (
				<Dropdown reference={reference} ref={target} placement='top-start'>
					<DeviceMenuContext.Provider value={close}>{children}</DeviceMenuContext.Provider>
				</Dropdown>
			)}
		</Box>
	);
};

export default DeviceMenu;
