import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Dropdown, Icon } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useDropdownVisibility } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useCallback } from 'react';

import { DeviceMenuContext } from './DeviceMenuContext';

/**
 * The device icon, its name, and the chevron at the far end. A plain button rather than `GenericMenu`, which
 * decides its trigger's icon and class itself.
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
		gap: 0.5rem;
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
	children: ReactNode;
};

/**
 * A dropdown for choosing one device on the preflight.
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
				size='small'
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
