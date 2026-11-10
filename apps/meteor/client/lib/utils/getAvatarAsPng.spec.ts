import { getAvatarAsPng } from './getAvatarAsPng';

jest.mock('../getUserAvatarURL', () => ({
	getUserAvatarURL: (username: string) => `/avatar/${username}`,
}));

const loadAvatar = (width: number, height: number) => {
	const context: Partial<CanvasRenderingContext2D> = {};
	const drawImage = jest.fn((..._args: unknown[]) => context.imageSmoothingQuality);
	context.drawImage = drawImage;
	jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as CanvasRenderingContext2D);
	const toDataURL = jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,');
	jest.spyOn(window, 'Image').mockImplementation(() => {
		const image = document.createElement('img');
		Object.defineProperties(image, { width: { value: width }, height: { value: height } });
		queueMicrotask(() => image.onload?.(new Event('load')));
		return image;
	});

	return new Promise<{ canvas: HTMLCanvasElement; drawImage: jest.Mock }>((resolve) =>
		getAvatarAsPng('user', () => resolve({ canvas: toDataURL.mock.contexts[0] as HTMLCanvasElement, drawImage })),
	);
};

afterEach(() => jest.restoreAllMocks());

it.each([
	[200, 200, 128, 128],
	[1600, 1200, 128, 96],
	[1200, 1600, 96, 128],
	[64, 64, 64, 64],
	[1, 512, 1, 128],
])('draws a %ix%i avatar as a %ix%i notification icon', async (width, height, iconWidth, iconHeight) => {
	const { canvas, drawImage } = await loadAvatar(width, height);

	expect(canvas).toMatchObject({ width: iconWidth, height: iconHeight });
	expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, iconWidth, iconHeight);
	expect(drawImage).toHaveReturnedWith('high');
});
