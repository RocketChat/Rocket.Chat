import { toggleSwitchParts } from './ToggleSwitch.native';

jest.mock('react-native', () => ({ Pressable: 'RNPressable' }), { virtual: true });

describe('toggleSwitchParts', () => {
	it('draws an unchecked switch as a muted track with the thumb at the start', () => {
		const { track, thumb } = toggleSwitchParts({ checked: false, disabled: false });

		expect(track).toEqual({ backgroundColor: '$rcx-stroke-medium', borderColor: '$rcx-stroke-medium', justifyContent: 'flex-start' });
		expect(thumb.backgroundColor).toBe('$rcx-button-font-on-primary');
	});

	it('draws a checked switch as a primary track with the thumb at the end', () => {
		const { track, thumb } = toggleSwitchParts({ checked: true, disabled: false });

		expect(track).toEqual({
			backgroundColor: '$rcx-button-background-primary-default',
			borderColor: '$rcx-button-background-primary-default',
			justifyContent: 'flex-end',
		});
		expect(thumb.backgroundColor).toBe('$rcx-button-font-on-primary');
	});

	it('dims the track and the thumb of a disabled unchecked switch', () => {
		const { track, thumb } = toggleSwitchParts({ checked: false, disabled: true });

		expect(track.backgroundColor).toBe('$rcx-button-background-secondary-disabled');
		expect(thumb.backgroundColor).toBe('$rcx-button-font-on-secondary-disabled');
	});

	it('dims only the track of a disabled checked switch', () => {
		const { track, thumb } = toggleSwitchParts({ checked: true, disabled: true });

		expect(track.backgroundColor).toBe('$rcx-button-background-primary-disabled');
		expect(thumb.backgroundColor).toBe('$rcx-button-font-on-primary');
	});
});
