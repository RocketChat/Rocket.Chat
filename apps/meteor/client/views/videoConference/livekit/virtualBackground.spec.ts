import {
	activateVirtualBackground,
	deactivateVirtualBackground,
	getVirtualBackgroundSnapshot,
	selectVirtualBackground,
} from './virtualBackground';

const originalCreateImageBitmap = Object.getOwnPropertyDescriptor(globalThis, 'createImageBitmap');

afterEach(() => {
	if (originalCreateImageBitmap) {
		Object.defineProperty(globalThis, 'createImageBitmap', originalCreateImageBitmap);
	} else {
		Reflect.deleteProperty(globalThis, 'createImageBitmap');
	}
});

it('decodes, bounds and reactivates a local replacement background', async () => {
	const decoded = { width: 5120, height: 2880, close: jest.fn() } as unknown as ImageBitmap;
	const resized = { width: 2560, height: 1440, close: jest.fn() } as unknown as ImageBitmap;
	const createBitmap = jest.fn().mockResolvedValueOnce(decoded).mockResolvedValueOnce(resized);
	Object.defineProperty(globalThis, 'createImageBitmap', { value: createBitmap, configurable: true });

	await selectVirtualBackground(new File(['image'], 'studio.png', { type: 'image/png' }));

	expect(createBitmap).toHaveBeenNthCalledWith(1, expect.any(File), { imageOrientation: 'flipY' });
	expect(createBitmap).toHaveBeenNthCalledWith(
		2,
		decoded,
		expect.objectContaining({ resizeWidth: 2560, resizeHeight: 1440, resizeQuality: 'high' }),
	);
	expect(decoded.close).toHaveBeenCalledTimes(1);
	expect(getVirtualBackgroundSnapshot()).toEqual({ active: true, image: resized, name: 'studio.png' });

	deactivateVirtualBackground();
	expect(getVirtualBackgroundSnapshot().active).toBe(false);
	activateVirtualBackground();
	expect(getVirtualBackgroundSnapshot().active).toBe(true);
});
