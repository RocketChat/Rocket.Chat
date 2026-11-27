import { Page } from './page';

describe('Page', () => {
	const page = new Page();

	beforeAll(() => {
		page.registerRoute('*', () => undefined);
		page.start();
	});

	afterEach(() => {
		page.setBase('');
	});

	afterAll(() => {
		page.stop();
	});

	const isClickHandledByRouter = (href: string) => {
		const anchor = document.createElement('a');
		anchor.href = href;
		document.body.appendChild(anchor);

		let handled = false;
		const observe = (e: MouseEvent) => {
			handled = e.defaultPrevented;
			e.preventDefault();
		};

		window.addEventListener('click', observe);
		anchor.click();
		window.removeEventListener('click', observe);
		anchor.remove();

		return handled;
	};

	it.each(['/home', '/admin/info', '/apis', '/api-keys', '/apidocs'])('handles a link to %s', (href) => {
		expect(isClickHandledByRouter(href)).toBe(true);
	});

	it.each(['/api', '/api/v1/info', '/api/docs/json?withUndocumented=true', '/api-docs', '/api-docs/', '/api-docs#/Users', '/api-docs?x=1'])(
		'leaves a link to %s to the browser',
		(href) => {
			expect(isClickHandledByRouter(href)).toBe(false);
		},
	);

	it('leaves a link to the server pages to the browser under a path prefix', () => {
		page.setBase('/chat');

		expect(isClickHandledByRouter('/chat/api-docs')).toBe(false);
		expect(isClickHandledByRouter('/chat/home')).toBe(true);
	});
});
