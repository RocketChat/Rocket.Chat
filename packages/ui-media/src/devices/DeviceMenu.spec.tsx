import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DeviceMenu from './DeviceMenu';
import type { DeviceMenuChoices } from './DeviceMenu';
import { DeviceSelectionProvider } from './DeviceSelectionContext';

const devices = [
	{ deviceId: 'brio', kind: 'videoinput', label: 'Logitech BRIO (046d:085e)', groupId: 'brio' },
] as unknown as MediaDeviceInfo[];

const renderMenu = (choices: DeviceMenuChoices[], select = jest.fn()) =>
	render(
		<DeviceSelectionProvider value={{ devices, selectedIds: { videoinput: 'brio' }, select }}>
			<DeviceMenu kinds={['videoinput']} title='Camera' placement='top-end' choices={choices} button={<button type='button' />} />
		</DeviceSelectionProvider>,
		{ wrapper: mockAppRoot().build() },
	);

const qualities = (onSelect: jest.Mock): DeviceMenuChoices => ({
	title: 'Resolution',
	choices: [
		{ id: 'auto', name: 'Auto', selected: true, onSelect },
		{ id: 'h720', name: '720p', note: 'Sending 720p', selected: false, onSelect },
	],
});

// The choices share the menu with the devices, so picking one must not be mistaken for picking a device.
it('offers the choices under the devices, and picks one without switching the device', async () => {
	const onSelect = jest.fn();
	const select = jest.fn();
	renderMenu([qualities(onSelect)], select);

	await userEvent.click(screen.getByRole('button', { name: 'Camera' }));
	expect(await screen.findByText('Logitech BRIO')).toBeInTheDocument();
	expect(screen.getByText('Sending 720p')).toBeInTheDocument();

	await userEvent.click(screen.getByText('720p'));

	expect(onSelect).toHaveBeenCalledTimes(1);
	expect(select).not.toHaveBeenCalled();
});

it('does nothing for the choice already in use', async () => {
	const onSelect = jest.fn();
	renderMenu([qualities(onSelect)]);

	await userEvent.click(screen.getByRole('button', { name: 'Camera' }));
	await userEvent.click(await screen.findByText('Auto'));

	expect(onSelect).not.toHaveBeenCalled();
});

it('offers a disabled choice as unavailable', async () => {
	const onSelect = jest.fn();
	renderMenu([{ title: 'Resolution', choices: [{ id: 'h720', name: '720p', selected: false, disabled: true, onSelect }] }]);

	await userEvent.click(screen.getByRole('button', { name: 'Camera' }));

	expect(await screen.findByRole('menuitemradio', { name: /720p/ })).toHaveAttribute('aria-disabled', 'true');
});
