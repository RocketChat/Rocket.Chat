import { mockAppRoot } from '@rocket.chat/mock-providers';
import { DeviceSelectionProvider } from '@rocket.chat/ui-media';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CameraPicker from './CameraPicker';
import { CallStateProvider } from './context';
import { VideoQualityProvider } from '../devices/VideoQualityContext';
import { buildCallState, buildDeviceSelection, buildVideoQuality, fakeDevices } from '../fixtures/callFixtures';

const getUserMedia = jest.fn();

beforeAll(() => {
	Object.defineProperty(navigator, 'mediaDevices', {
		configurable: true,
		value: { getUserMedia, enumerateDevices: jest.fn(async () => []) },
	});
});

beforeEach(() => {
	getUserMedia.mockReset();
	getUserMedia.mockResolvedValue({ getTracks: () => [] });
});

const renderPicker = (devices: MediaDeviceInfo[]) =>
	render(
		<CallStateProvider value={buildCallState()}>
			<DeviceSelectionProvider value={buildDeviceSelection({ devices })}>
				<VideoQualityProvider value={buildVideoQuality()}>
					<CameraPicker />
				</VideoQualityProvider>
			</DeviceSelectionProvider>
		</CallStateProvider>,
		{ wrapper: mockAppRoot().build() },
	);

// Without camera permission the browser lists cameras with no names, and a menu of "Default"s picks nothing.
it('asks for the camera before opening a menu of unnamed cameras', async () => {
	let grant: (stream: unknown) => void = () => undefined;
	getUserMedia.mockReturnValue(
		new Promise((resolve) => {
			grant = resolve;
		}),
	);
	renderPicker(fakeDevices.map((device) => ({ ...device, label: '' }) as MediaDeviceInfo));

	await userEvent.click(screen.getByRole('button'));

	await waitFor(() => expect(getUserMedia).toHaveBeenCalledWith({ video: true }));
	expect(screen.queryByRole('menu')).not.toBeInTheDocument();

	grant({ getTracks: () => [] });
	expect(await screen.findByRole('menu')).toBeInTheDocument();
});

// A refused camera still leaves the menu to pick from, with whatever the browser lists.
it('opens the menu when the camera is refused', async () => {
	getUserMedia.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
	renderPicker(fakeDevices.map((device) => ({ ...device, label: '' }) as MediaDeviceInfo));

	await userEvent.click(screen.getByRole('button'));

	expect(await screen.findByRole('menu')).toBeInTheDocument();
});

it('asks nothing once the cameras are named', async () => {
	renderPicker(fakeDevices);

	await userEvent.click(screen.getByRole('button'));

	expect(await screen.findByRole('menu')).toBeInTheDocument();
	expect(getUserMedia).not.toHaveBeenCalled();
});
