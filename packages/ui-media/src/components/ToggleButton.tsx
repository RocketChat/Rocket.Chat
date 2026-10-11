import { Icon, IconButton } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { ComponentProps } from 'react';

export type ToggleButtonProps = {
	label: string; // label should not change due to a11y constraints
	icons: [defaultIcon: Keys, pressedIcon: Keys];
	titles: [defaultTitle: string, pressedTitle: string]; // Titles might change though
	disabled?: boolean;
	pressed?: boolean;
	/**
	 * Whether *pressed* is the state worth shouting about — a muted mic, a dark camera — in which case the whole
	 * button goes `secondary-danger` rather than only its glyph turning red.
	 *
	 * Opt-in, because for most of these toggles pressed means *active*: a shared screen or a raised hand is not a
	 * problem, and colouring it as one would read as an error.
	 */
	dangerWhenPressed?: boolean;
	/** Renders the larger variant used by the conference UI. The widget keeps its original size by default. */
	large?: boolean;
	onToggle?: () => void;
} & Omit<ComponentProps<typeof IconButton>, 'icon' | 'title' | 'aria-label' | 'disabled' | 'onClick'>;

const ToggleButton = ({
	disabled,
	label,
	pressed,
	icons,
	titles,
	onToggle,
	danger = true,
	secondary = true,
	tiny = false,
	large = false,
	dangerWhenPressed = false,
	...props
}: ToggleButtonProps) => (
	<IconButton
		{...props}
		label={label}
		tiny={tiny}
		large={large}
		medium={!tiny && !large}
		secondary={secondary}
		danger={dangerWhenPressed && pressed}
		icon={
			<Icon
				size={large ? 20 : 16}
				color={!dangerWhenPressed && pressed && danger ? 'font-danger' : undefined}
				name={icons[pressed ? 1 : 0]}
			/>
		}
		title={titles[pressed ? 1 : 0]}
		aria-label={label}
		disabled={disabled}
		onClick={onToggle}
	/>
);

export default ToggleButton;
