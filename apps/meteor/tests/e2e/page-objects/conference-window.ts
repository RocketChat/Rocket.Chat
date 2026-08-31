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
	// ---------------------------------------------------------------------------------------------------------

	/** The screen's own heading, and the only `h2` on it. */
	getPreflightHeading(text: string | RegExp): Locator {
		return this.page.getByRole('heading', { level: 2, name: text });
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
	 * The window's own bar above the call and its panels: `CallTopBar` renders a `<header>`, and it is the only
	 * one in the window. The chat-access notice above it is a `status`, not a second banner, and the room header
	 * inside the chat panel is suppressed by the embedded layout.
	 */
	get topBar(): Locator {
		return this.page.getByRole('banner');
	}

	/** How long the call has been running — a live region counting up, which is what `timer` says. */
	get timer(): Locator {
		return this.topBar.getByRole('timer');
	}

	/**
	 * The members button, whose accessible name carries the count of who is in the call — the badge that draws
	 * it is `aria-hidden`, so the name is the only place the number is readable. Its `title` says the same.
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

	/**
	 * The panel title addressed by what it says. The chat's title has an icon between its words, so its own name
	 * is the label on the span around them — `Chat in <room>` — rather than the text as it happens to be laid out.
	 */
	getPanelTitle(name: string | RegExp): Locator {
		return this.page.getByRole('heading', { level: 5, name });
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

	/** The members the People panel lists, as the list it is. */
	get listMembers(): Locator {
		return this.page.getByRole('list', { name: 'Members', exact: true });
	}

	/**
	 * A member's status line in the People panel: `Ringing`, `Waiting for answer`, `Declined` or `Left`. A
	 * member who is in the call has no status line at all.
	 *
	 * A member's name and their status are two text nodes in one row, so they are asserted on separately —
	 * scoped to the list, which is what keeps them from matching the same words elsewhere in the window.
	 */
	getMemberStatus(status: 'Ringing' | 'Waiting for answer' | 'Declined' | 'Left'): Locator {
		return this.listMembers.getByText(status, { exact: true });
	}

	getBtnRingMember(name: string): Locator {
		return this.listMembers.getByRole('button', { name: `Ring ${name}`, exact: true });
	}

	getMember(name: string): Locator {
		return this.listMembers.getByText(name, { exact: true });
	}

	// ---------------------------------------------------------------------------------------------------------
	// Add participants
	// ---------------------------------------------------------------------------------------------------------

	get dialogAddPeople(): Locator {
		return this.page.getByRole('dialog', { name: 'Add people' });
	}

	/** Labelled rather than named by its placeholder, which the first keystroke takes away. */
	get inputAddPeople(): Locator {
		return this.dialogAddPeople.getByRole('combobox', { name: 'Add people', exact: true });
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
