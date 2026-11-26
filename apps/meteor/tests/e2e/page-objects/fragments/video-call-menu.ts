import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

type LinkAction = 'Open' | 'Join call' | 'Copy link' | 'Rename' | 'Delete';

/** The menu the room header's video call button opens with the native provider, and the dialogs its entries open. */
export class VideoCallMenu {
	constructor(
		private readonly page: Page,
		readonly btnVideoCall: Locator,
	) {}

	private get menu(): Locator {
		return this.page.getByRole('menu', { name: 'Video call', exact: true });
	}

	get btnStartConference(): Locator {
		return this.menu.getByRole('menuitem', { name: 'Start conference', exact: true });
	}

	get btnCreateLink(): Locator {
		return this.menu.getByRole('menuitem', { name: 'Create link', exact: true });
	}

	get textConferenceLinks(): Locator {
		return this.menu.getByText('Conference links', { exact: true });
	}

	/** A link's row, by the title its name holds, whether or not a conference runs from it. */
	getBtnLink(title: string): Locator {
		return this.menu.getByRole('menuitem', { name: title });
	}

	/** A link's row as it is announced while a conference runs from it. */
	getBtnOngoingLink(title: string): Locator {
		return this.menu.getByRole('menuitem', { name: `${title}, ongoing` });
	}

	getTextOngoing(title: string): Locator {
		return this.getBtnLink(title).getByText('Ongoing', { exact: true });
	}

	/** The sub menu of a link's row, named after the row that opens it. */
	private linkActions(title: string): Locator {
		return this.page.getByRole('menu', { name: title });
	}

	getBtnLinkAction(title: string, action: LinkAction): Locator {
		return this.linkActions(title).getByRole('menuitem', { name: action, exact: true });
	}

	async open(): Promise<void> {
		await this.btnVideoCall.click();
		await expect(this.menu).toBeVisible();
	}

	/** Opens the menu and then the sub menu of the link titled `title`, by tap where the test runs on a touch screen. */
	async openLinkActions(title: string, { tap = false } = {}): Promise<void> {
		await this.open();
		await expect(this.getBtnLink(title)).toBeVisible();
		await (tap ? this.getBtnLink(title).tap() : this.getBtnLink(title).click());
		await expect(this.linkActions(title)).toBeVisible();
	}

	private get dialogCreateLink(): Locator {
		return this.page.getByRole('dialog', { name: 'Create link', exact: true });
	}

	private get dialogRenameLink(): Locator {
		return this.page.getByRole('dialog', { name: 'Rename link', exact: true });
	}

	private get dialogDeleteLink(): Locator {
		return this.page.getByRole('dialog', { name: 'Delete link', exact: true });
	}

	get textCreateLinkTitle(): Locator {
		return this.dialogCreateLink.getByText('Create link', { exact: true });
	}

	get textRenameLinkTitle(): Locator {
		return this.dialogRenameLink.getByText('Rename link', { exact: true });
	}

	get textDeleteLinkTitle(): Locator {
		return this.dialogDeleteLink.getByText('Delete link', { exact: true });
	}

	/** The link name field of whichever of the create and rename dialogs is open. */
	get inputLinkName(): Locator {
		return this.dialogCreateLink.or(this.dialogRenameLink).getByRole('textbox', { name: 'Link name' });
	}

	get textRenameHint(): Locator {
		return this.dialogRenameLink.getByText(
			"The link's address changes with its name. Share the new address with anyone who used the old one.",
			{ exact: true },
		);
	}

	getTextDeleteLink(title: string): Locator {
		return this.dialogDeleteLink.getByText(`Delete ${title}?`);
	}

	get btnCreate(): Locator {
		return this.dialogCreateLink.getByRole('button', { name: 'Create', exact: true });
	}

	get btnCancelCreate(): Locator {
		return this.dialogCreateLink.getByRole('button', { name: 'Cancel', exact: true });
	}

	get btnRename(): Locator {
		return this.dialogRenameLink.getByRole('button', { name: 'Rename', exact: true });
	}

	get btnDelete(): Locator {
		return this.dialogDeleteLink.getByRole('button', { name: 'Delete', exact: true });
	}
}
