import type { Locator, Page } from '@playwright/test';

/**
 * Base class for page objects that own a route.
 *
 * Subclasses declare the `route` they live at and how to tell that route has finished rendering, and
 * get `goto()` for free: it navigates and waits for the page to be usable before returning, so tests
 * never have to follow a raw `page.goto()` with an ad-hoc wait.
 *
 * Pages that own more than one route (admin settings sections, account tabs, ...) expose extra
 * `gotoSomething()` methods built on top of `navigateTo()`.
 */
export abstract class RoutedPage {
	/** Path this page lives at, relative to the workspace base URL. */
	protected abstract readonly route: string;

	constructor(public readonly page: Page) {}

	/** Navigates to the page's route and waits for it to be ready. */
	async goto(): Promise<void> {
		await this.navigateTo(this.route);
	}

	/**
	 * Navigates to the page's route and waits for `until` instead of the page's default ready state.
	 *
	 * For routes that can legitimately settle on something else — an upsell dialog, a "not authorized"
	 * message, a redirect to login — so the wait still matches what the test expects.
	 */
	async gotoExpecting(until: Locator): Promise<void> {
		await this.navigateTo(this.route, until);
	}

	/** Waits until the route has finished rendering and the page is usable, without navigating. */
	abstract waitForReady(): Promise<void>;

	/**
	 * Navigates to one of the page's routes and waits until it is ready.
	 *
	 * @param route path to navigate to
	 * @param until element or waiter to use, when the route settles on something other than its ready state
	 */
	protected async navigateTo(route: string, until?: Locator | (() => Promise<unknown>)): Promise<void> {
		await this.page.goto(route);

		if (!until) {
			await this.waitForReady();
			return;
		}

		if (typeof until === 'function') {
			await until();
			return;
		}

		await until.waitFor({ state: 'visible' });
	}
}
