import { styled, View } from '@tamagui/web';
import { useState } from 'react';
import { Pressable } from 'react-native';

import type { ToggleSwitchContract } from './ToggleSwitch.contract';
import type { ChangeEvents } from '../../types/Attributes.contract';

export type ToggleSwitchProps = ToggleSwitchContract & ChangeEvents<boolean>;

// The track and thumb colors of ToggleSwitch.styles.scss, which React Native cannot read from a stylesheet.
const trackColors = {
	off: { default: '$rcx-stroke-medium', disabled: '$rcx-button-background-secondary-disabled' },
	on: { default: '$rcx-button-background-primary-default', disabled: '$rcx-button-background-primary-disabled' },
} as const;

/** What the track and the thumb show for a state; a checked thumb keeps its color when disabled, as the stylesheet does. */
export const toggleSwitchParts = ({ checked, disabled }: { checked: boolean; disabled: boolean }) => {
	const trackColor = trackColors[checked ? 'on' : 'off'][disabled ? 'disabled' : 'default'];

	return {
		track: {
			backgroundColor: trackColor,
			borderColor: trackColor,
			justifyContent: checked ? 'flex-end' : 'flex-start',
		},
		thumb: {
			backgroundColor: disabled && !checked ? '$rcx-button-font-on-secondary-disabled' : '$rcx-button-font-on-primary',
		},
	} as const;
};

const ToggleSwitchTrack = styled(View, {
	width: '$size.x36',
	height: '$size.x18',
	borderWidth: 1,
	borderRadius: '$radius.full',
	flexDirection: 'row',
	alignItems: 'center',
	paddingHorizontal: 1,
});

// The track's inner height minus a pixel of room on each side.
const ToggleSwitchThumb = styled(View, {
	width: 14,
	height: 14,
	borderRadius: '$radius.full',
});

function ToggleSwitch({
	checked,
	defaultChecked = false,
	disabled = false,
	onChange,
	labelChildren,
	testID,
	ref,
	'aria-label': ariaLabel,
	'aria-labelledby': ariaLabelledBy,
	'aria-describedby': ariaDescribedBy,
}: ToggleSwitchProps) {
	const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
	const isChecked = checked ?? uncontrolledChecked;
	const { track, thumb } = toggleSwitchParts({ checked: isChecked, disabled });

	return (
		<Pressable
			ref={ref}
			role='switch'
			accessibilityState={{ checked: isChecked, disabled }}
			aria-label={ariaLabel}
			aria-labelledby={ariaLabelledBy}
			aria-describedby={ariaDescribedBy}
			disabled={disabled}
			testID={testID}
			style={{ flexDirection: 'row', alignItems: 'center' }}
			onPress={() => {
				const next = !isChecked;
				if (checked === undefined) {
					setUncontrolledChecked(next);
				}
				onChange?.(next);
			}}
		>
			{labelChildren}
			<ToggleSwitchTrack backgroundColor={track.backgroundColor} borderColor={track.borderColor} justifyContent={track.justifyContent}>
				<ToggleSwitchThumb backgroundColor={thumb.backgroundColor} />
			</ToggleSwitchTrack>
		</Pressable>
	);
}

export default ToggleSwitch;
