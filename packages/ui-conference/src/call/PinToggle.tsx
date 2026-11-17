import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps, MouseEvent } from 'react';
import { useCallback } from 'react';

export type PinToggleProps = Omit<ComponentProps<typeof IconButton>, 'icon' | 'onClick' | 'pressed' | 'aria-pressed'> & {
	/** What is pinned, when the pin itself would not say: the pressed state still tells pinned from not. */
	icon?: ComponentProps<typeof IconButton>['icon'];
	pinned: boolean;
	label: string;
	onPinToggle: (hadFocus: boolean) => void;
	/** Takes the focus when drawn: the same pin was just toggled from the keyboard somewhere it no longer is. */
	restoreFocus?: boolean;
};

/** Pins or unpins one thing on the stage, pressed while it is pinned. */
const PinToggle = ({ icon, pinned, label, onPinToggle, restoreFocus = false, title, ...props }: PinToggleProps) => {
	const focusRef = useCallback(
		(node: Element | null) => {
			if (restoreFocus && node instanceof HTMLElement) {
				node.focus();
			}
		},
		[restoreFocus],
	);

	return (
		<IconButton
			{...props}
			ref={focusRef}
			icon={icon ?? (pinned ? 'pin-filled' : 'pin')}
			pressed={pinned}
			aria-pressed={pinned}
			aria-label={label}
			title={title ?? label}
			onClick={(event: MouseEvent<HTMLElement>) => onPinToggle(event.currentTarget === document.activeElement)}
		/>
	);
};

export default PinToggle;
