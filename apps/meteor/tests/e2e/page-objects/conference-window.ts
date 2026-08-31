import type { Locator, Page } from '@playwright/test';

/**
 * The call window: the separate browser window `VideoConf_Conference_Window_Enabled` opens a conference in.
 *
 * It is a page of its own rather than a surface inside the app, so it takes a `Page` — the one handed over by
 * `context.waitForEvent('page')` — and every locator here is scoped to that window. Nothing in it is reachable
 * from the main app's page object, and the main app is deliberately not reachable from here: the window renders
 * standalone, with no navbar and no sidebar.
 *
 * Two screens live behind the same URL. `/conference/new?rid=…` is the preflight for a call that does not exist
 * yet — confirming it is what creates the conference — and `/conference/<callId>` is either the join preflight
 * or the call itself, depending on whether this window has joined.
 */
export class ConferenceWindow {
	constructor(public readonly page: Page) {}

	/**
	 * The call window as it is actually reached: something in the main app is clicked, the browser opens a window
	 * for it, and this is the handle on it.
	 *
	 * The wait is armed before the click, because `window.open` happens synchronously inside the click handler —
	 * asking for the page afterwards is a race with the window already being there.
	 */
	static async openedBy(page: Page, action: () => Promise<unknown>): Promise<ConferenceWindow> {
		const opening = page.context().waitForEvent('page');

		await action();

		const opened = await opening;
		await opened.waitForLoadState('domcontentloaded');

		return new ConferenceWindow(opened);
	}

	// ---------------------------------------------------------------------------------------------------------
	// Preflight
	//
	// Its heading is a `Box` with `fontScale='h2'`, i.e. a `div` — not a heading element — so it is addressable
	// by text only.
	// ---------------------------------------------------------------------------------------------------------

	getPreflightHeading(text: string | RegExp): Locator {
		return this.page.getByText(text);
	}

	get inputCallName(): Locator {
		return this.page.getByRole('textbox', { name: 'Call name' });
	}

	get checkboxRingPeople(): Locator {
		return this.page.getByRole('checkbox', { name: 'Ring people' });
	}

	/**
	 * What is actually clicked to answer the ring question: the checkbox's own input is drawn over by Fuselage,
	 * and the label beside it is what a user hits.
	 */
	get labelRingPeople(): Locator {
		return this.page.getByText('Ring people', { exact: true });
	}

	get textWillBeNotified(): Locator {
		return this.page.getByText('will be notified when you start the call');
	}

	get btnStartCall(): Locator {
		return this.page.getByRole('button', { name: 'Start call', exact: true });
	}

	getBtnCall(name: string): Locator {
		return this.page.getByRole('button', { name: `Call ${name}`, exact: true });
	}

	get btnJoinCall(): Locator {
		return this.page.getByRole('button', { name: 'Join call', exact: true });
	}

	get btnCancel(): Locator {
		return this.page.getByRole('button', { name: 'Cancel', exact: true });
	}

	get textPeopleInTheCall(): Locator {
		return this.page.getByText('People in the call', { exact: true });
	}

	/** The provider's device toggles, of which only the ones it declares a capability for are rendered. */
	get btnMic(): Locator {
		return this.page.getByRole('button', { name: /^Mic (On|Off)$/ });
	}

	get btnCam(): Locator {
		return this.page.getByRole('button', { name: /^Cam (On|Off)$/ });
	}

	// ---------------------------------------------------------------------------------------------------------
	// The call
	// ---------------------------------------------------------------------------------------------------------

	/**
	 * The window's own bar above the call and its panels. `CallTopBar` renders a `<header>`, and so does the
	 * chat-access notice above it, so this is `.first()` rather than an unqualified `banner`.
	 */
	get topBar(): Locator {
		return this.page.getByRole('banner').last();
	}

	/**
	 * The members button, whose accessible name carries the count of who is in the call — the badge that draws
	 * it is `aria-hidden`, so the name is the only place the number is readable.
	 *
	 * Note its `title` is `People` while its `aria-label` is the count, and the label wins: addressing it by
	 * `People` would not match.
	 */
	get btnMembers(): Locator {
		return this.page.getByRole('button', { name: /\d+ (person|people) in the call/ });
	}

	getBtnMembers(count: number): Locator {
		return this.page.getByRole('button', { name: `${count} ${count === 1 ? 'person' : 'people'} in the call`, exact: true });
	}

	get btnChat(): Locator {
		return this.page.getByRole('button', { name: /^Chat(,|$)/ });
	}

	/** The provider's page, framed rather than handed a tab of its own. Named with `aria-label`, never `title`. */
	get frameProvider(): Locator {
		return this.page.getByLabel('Conference Call', { exact: true });
	}

	// ---------------------------------------------------------------------------------------------------------
	// Side panels — members and chat share one slot
	// ---------------------------------------------------------------------------------------------------------

	get panelTitle(): Locator {
		return this.page.getByRole('heading', { level: 5 });
	}

	get btnClosePanel(): Locator {
		return this.page.locator('[data-qa="ContextualbarActionClose"]');
	}

	get btnAddPeople(): Locator {
		return this.page.getByRole('button', { name: 'Add people', exact: true });
	}

	get textInCall(): Locator {
		return this.page.getByText('In call', { exact: true });
	}

	get textNotInTheCall(): Locator {
		return this.page.getByText('Not in the call', { exact: true });
	}

	/**
	 * A member's status line in the People panel: `Ringing`, `Waiting for answer`, `Declined` or `Left`. A
	 * member who is in the call has no status line at all.
	 *
	 * Fuselage's `Option` renders an `<li>` with no role inside a `div`, so a member row has no role of its own
	 * and the name and the status are two text nodes in it. With a handful of members that is enough to assert
	 * on separately; naming a row is not possible.
	 */
	getMemberStatus(status: 'Ringing' | 'Waiting for answer' | 'Declined' | 'Left'): Locator {
		return this.page.getByText(status, { exact: true });
	}

	getBtnRingMember(name: string): Locator {
		return this.page.getByRole('button', { name: `Ring ${name}`, exact: true });
	}

	getMember(name: string): Locator {
		return this.page.getByText(name, { exact: true });
	}

	// ---------------------------------------------------------------------------------------------------------
	// Add participants
	// ---------------------------------------------------------------------------------------------------------

	get dialogAddPeople(): Locator {
		return this.page.getByRole('dialog', { name: 'Add people' });
	}

	/** No `aria-label` and no `data-qa`: only its placeholder names it, and it is the modal's only combobox. */
	get inputAddPeople(): Locator {
		return this.dialogAddPeople.getByRole('combobox');
	}

	get btnConfirmAddPeople(): Locator {
		return this.dialogAddPeople.getByRole('button', { name: 'Add', exact: true });
	}

	async addPeople(username: string): Promise<void> {
		await this.btnAddPeople.click();
		await this.inputAddPeople.click();
		await this.inputAddPeople.fill(username);
		await this.page.getByRole('option', { name: username, exact: true }).click();
		await this.btnConfirmAddPeople.click();
	}

	// ---------------------------------------------------------------------------------------------------------
	// States
	// ---------------------------------------------------------------------------------------------------------

	getStateTitle(title: string): Locator {
		return this.page.getByRole('heading', { name: title, level: 3 });
	}

	get btnClose(): Locator {
		return this.page.getByRole('button', { name: 'Close', exact: true });
	}

	/** The call window carries none of the app's navigation, which is what "standalone" means for it. */
	get appNavigation(): Locator {
		return this.page.getByRole('navigation');
	}
}
