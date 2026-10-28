const cssInJsClassRegex = /^rcx-css-[a-z0-9]+$/;

declare global {
	// oxlint-disable-next-line @typescript-eslint/no-namespace
	namespace jest {
		interface Matchers<R> {
			toHaveCssInJsClass(): R;
		}
	}
}

expect.extend({
	toHaveCssInJsClass: (received: Element | null) => {
		if (!received) {
			return {
				message: () => 'expected received element not to be null',
				pass: false,
			};
		}

		for (let i = 0; i < received.classList.length; ++i) {
			const className = received.classList.item(i);
			const matches = className ? cssInJsClassRegex.test(className) : false;

			if (matches) {
				return {
					message: () => 'expected received element not to have a css-in-js class',
					pass: true,
				};
			}
		}

		return {
			message: () => 'expected received element to have a css-in-js class',
			pass: false,
		};
	},
});

let spyConsoleError: jest.SpyInstance;
let spyConsoleWarn: jest.SpyInstance;

beforeAll(() => {
	spyConsoleError = jest.spyOn(console, 'error');
	spyConsoleWarn = jest.spyOn(console, 'warn');
});

afterAll(() => {
	try {
		expect(spyConsoleError).not.toHaveBeenCalled();
		expect(spyConsoleWarn).not.toHaveBeenCalled();
	} finally {
		spyConsoleError?.mockRestore();
		spyConsoleWarn?.mockRestore();
	}
});

export {};
