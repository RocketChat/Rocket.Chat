import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Icon } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

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

const icons: Record<MediaDeviceKind, IconName> = { audioinput: 'mic', audiooutput: 'volume', videoinput: 'video' };

/**
 * What GenericMenu stamps onto the trigger it clones. Its icon, title, class and size are dropped: this trigger draws
 * the device's own, and `pressed` is only read for which way the chevron points.
 */
type MenuTriggerProps = Omit<ComponentProps<typeof Button>, 'children' | 'ref'> & { pressed?: boolean };

export type PreflightDeviceMenuButtonProps = MenuTriggerProps & {
	kind: MediaDeviceKind;
	label: string;
	/** The name of what the device is set to; the label stands in while there is none. */
	current?: string;
};

/** The device icon, its name, and the chevron at the far end. */
const PreflightDeviceMenuButton = forwardRef<HTMLButtonElement, PreflightDeviceMenuButtonProps>(function PreflightDeviceMenuButton(
	{ kind, label, current, pressed, icon: _icon, title: _title, className: _className, small: _small, ...menuProps },
	ref,
) {
	// Spread because GenericMenu clones this trigger with the props that open the menu, which must reach the button.
	return (
		<Button {...menuProps} ref={ref} size='small' className={triggerStyles} aria-label={label} title={current || label}>
			<Icon name={icons[kind]} size='x16' flexShrink={0} />
			<Box className={nameStyles}>{current || label}</Box>
			<Icon name={pressed ? 'chevron-up' : 'chevron-down'} size='x16' flexShrink={0} />
		</Button>
	);
});

export default PreflightDeviceMenuButton;
