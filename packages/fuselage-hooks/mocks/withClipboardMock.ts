export const withClipboardMock = () => {
	const clipboard = {
		writeText: (): Promise<void> => Promise.resolve(),
	};

	beforeAll(() => {
		Object.assign(navigator, {
			clipboard,
		});
	});

	afterAll(() => {
		delete (navigator as { clipboard?: Clipboard }).clipboard;
	});

	afterEach(() => {
		clipboard.writeText = () => Promise.resolve();
	});

	return (fn: () => Promise<void>) => {
		clipboard.writeText = fn;
	};
};
