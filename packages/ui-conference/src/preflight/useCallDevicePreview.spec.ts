import { renderHook, waitFor } from '@testing-library/react';

import { useCallDevicePreview } from './useCallDevicePreview';

const getUserMedia = jest.fn();
const enumerateDevices = jest.fn(() => Promise.resolve([] as MediaDeviceInfo[]));

const fakeStream = () => {
	const stream = {
		active: true,
		getTracks: () => [
			{
				stop: () => {
					stream.active = false;
				},
			},
		],
	};
	return stream as unknown as MediaStream;
};

beforeAll(() => {
	Object.defineProperty(navigator, 'mediaDevices', {
		configurable: true,
		value: { getUserMedia, enumerateDevices, addEventListener: jest.fn(), removeEventListener: jest.fn() },
	});
});

beforeEach(() => {
	getUserMedia.mockReset();
	enumerateDevices.mockClear();
});

// Asking the browser for no track at all is rejected, which used to show a camera-only preflight as failing.
it('opens nothing when only the camera is on', async () => {
	const { result } = renderHook(() => useCallDevicePreview({ mic: false, cam: true }, { camId: 'brio' }));

	await waitFor(() => expect(enumerateDevices).toHaveBeenCalled());
	expect(getUserMedia).not.toHaveBeenCalled();
	expect(result.current.stream).toBeNull();
});

it('opens the chosen microphone, and only the microphone', async () => {
	const stream = fakeStream();
	getUserMedia.mockResolvedValue(stream);

	const { result } = renderHook(() => useCallDevicePreview({ mic: true, cam: true }, { micId: 'yeti', camId: 'brio' }));

	await waitFor(() => expect(result.current.stream).toBe(stream));
	expect(getUserMedia).toHaveBeenCalledWith({ audio: { deviceId: 'yeti' }, video: false });
});

it('shows no stream once the microphone is off, nor the stopped one when it comes back on', async () => {
	getUserMedia.mockResolvedValueOnce(fakeStream()).mockReturnValueOnce(new Promise(() => undefined));

	const { result, rerender } = renderHook(({ mic }) => useCallDevicePreview({ mic, cam: false }, {}), { initialProps: { mic: true } });
	await waitFor(() => expect(result.current.stream).not.toBeNull());

	rerender({ mic: false });
	expect(result.current.stream).toBeNull();

	rerender({ mic: true });
	expect(result.current.stream).toBeNull();
});
