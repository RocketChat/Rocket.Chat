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
	dangerWhenPressed = false,
	...props
}: ToggleButtonProps) => {
	const iconName = icons[pressed ? 1 : 0];
	const title = titles[pressed ? 1 : 0];
	// The whole button carries it when asked; otherwise the glyph alone does, as before.
	const asDanger = dangerWhenPressed && Boolean(pressed);
	const iconColor = !dangerWhenPressed && pressed && danger ? 'font-danger' : undefined;

	const size = tiny ? { tiny: true } : { large: true };

	return (
		<IconButton
			{...props}
			label={label}
			{...size}
			secondary={secondary}
			danger={asDanger}
			icon={
				<Icon
					size={20}
					color={iconColor}
					name={iconName}
					// `mic-off` slashes the other way from `video-off`, so side by side they read as two unrelated
					// marks. Mirroring flips the slash without visibly changing the mic, which is symmetric about
					// that axis.
					{...(iconName === 'mic-off' && { style: { transform: 'scaleX(-1)' } })}
				/>
			}
			title={title}
			aria-label={label}
			disabled={disabled}
			onClick={onToggle}
		/>
	);
};

export default ToggleButton;
