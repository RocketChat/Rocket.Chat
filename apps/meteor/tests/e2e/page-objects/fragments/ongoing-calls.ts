import type { Locator, Page } from '@playwright/test';

/**
 * The navbar's ongoing-calls button and its dropdown — the flag's own surface, and the only place an incoming
 * call is announced once `VideoConf_Conference_Window_Enabled` is on: there is no incoming-call popup any more.
 *
 * The button is absent, not disabled, when there is nothing to offer, so `btnOngoingCalls` being hidden is how
 * "no call is being offered to this user" reads.
 */
export class OngoingCalls {
	constructor(private readonly root: Page) {}

	/**
	 * Named `Ongoing calls` when nothing is counted and `1 ongoing call` / `N ongoing calls` when something is:
	 * the count lives in the accessible name because the badge that draws it is `aria-hidden`.
	 */
	get btnOngoingCalls(): Locator {
		return this.root.getByRole('button', { name: /^(Ongoing calls|\d+ ongoing calls?)$/ });
	}

	/**
	 * Fuselage's own `data-testid` is the only handle the dropdown has — it carries no role, no accessible name
	 * and no `data-qa` of its own.
	 */
	get dropdown(): Locator {
		return this.root.getByTestId('dropdown');
	}

	/**
	 * One call in the list, addressed by the name it is listed under.
	 *
	 * The row is an `<a>` with no `href`, so it has neither a `link` role nor an accessible name; its title text
	 * is all there is to hold on to. Clicking the text reaches the row's own handler, which is what answers or
	 * joins the call — the handler ignores clicks that landed on one of the row's buttons.
	 */
	getCall(name: string): Locator {
		return this.dropdown.getByText(name, { exact: true });
	}

	/** A call listed anywhere on the page, whether or not the dropdown happens to be open. */
	findCallAnywhere(name: string): Locator {
		return this.root.getByText(name, { exact: true });
	}

	/** The ringing mark a row shows in its timestamp corner. Scope a test to a single listed call before using it. */
	get textRinging(): Locator {
		return this.dropdown.getByText('Ringing');
	}

	/** What a declined row says where its actions were. */
	get textDeclined(): Locator {
		return this.dropdown.getByText('(Declined)', { exact: true });
	}

	get btnDecline(): Locator {
		return this.dropdown.getByRole('button', { name: 'Decline', exact: true });
	}

	get btnSilence(): Locator {
		return this.dropdown.getByRole('button', { name: 'Silence', exact: true });
	}

	/**
	 * Opens the list, unless it already opened itself.
	 *
	 * A ring opens the dropdown on its own — that is the whole point of it, since a call the user has to go
	 * looking for is a missed call — so clicking the button unconditionally would toggle it shut. Wait for the
	 * button before calling this: the auto-open happens in the same render that puts the button there, so once
	 * the button is settled so is the dropdown.
	 */
	async ensureOpen(): Promise<void> {
		await this.btnOngoingCalls.waitFor();

		if (await this.dropdown.isVisible()) {
			return;
		}

		await this.btnOngoingCalls.click();
		await this.dropdown.waitFor();
	}
}
