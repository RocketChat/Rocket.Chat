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
	 * What the button opens: a region named after the list it holds, which is what makes the calls in it a group
	 * to scope to rather than loose rows somewhere on the page.
	 */
	get regionOngoingCalls(): Locator {
		return this.root.getByRole('region', { name: 'Ongoing calls', exact: true });
	}

	/**
	 * One call in the list, addressed by the name it is listed under.
	 *
	 * The row is a link to the call — `/conference/<callId>` — named from its own contents, so the name it is
	 * listed under is part of that accessible name and enough to pick the row out of the list. Clicking it
	 * reaches the row's own handler, which is what answers or joins the call and what prevents the navigation;
	 * the handler ignores clicks that landed on one of the row's buttons.
	 */
	getCall(name: string): Locator {
		return this.regionOngoingCalls.getByRole('link', { name });
	}

	/**
	 * A call listed anywhere on the page, whether or not the dropdown happens to be open.
	 *
	 * Deliberately still a text lookup rather than the row's `link` role: this exists for `toHaveCount(0)`, and
	 * "the name appears nowhere at all" is a stronger thing to prove than "no row is named that".
	 */
	findCallAnywhere(name: string): Locator {
		return this.root.getByText(name, { exact: true });
	}

	/** The ringing mark a row shows in its timestamp corner. Scope a test to a single listed call before using it. */
	get textRinging(): Locator {
		return this.regionOngoingCalls.getByText('Ringing');
	}

	/** What a declined row says where its actions were. */
	get textDeclined(): Locator {
		return this.regionOngoingCalls.getByText('(Declined)', { exact: true });
	}

	get btnDecline(): Locator {
		return this.regionOngoingCalls.getByRole('button', { name: 'Decline', exact: true });
	}

	get btnSilence(): Locator {
		return this.regionOngoingCalls.getByRole('button', { name: 'Silence', exact: true });
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

		if (await this.regionOngoingCalls.isVisible()) {
			return;
		}

		await this.btnOngoingCalls.click();
		await this.regionOngoingCalls.waitFor();
	}
}
