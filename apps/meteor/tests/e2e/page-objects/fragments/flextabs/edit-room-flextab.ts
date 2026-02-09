import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';
import { Listbox } from '../listbox';

export class EditRoomFlexTab extends FlexTab {
	constructor(locator: Locator) {
		super(locator);
	}

	get inputTopic(): Locator {
		return this.root.getByRole('textbox', { name: 'Topic' });
	}

	get inputAnnouncement(): Locator {
		return this.root.getByRole('textbox', { name: 'Announcement' });
	}

	get inputDescription(): Locator {
		return this.root.getByRole('textbox', { name: 'Description' });
	}

	get checkboxReadOnly(): Locator {
		return this.root.locator('label', { hasText: 'Read-only' });
	}

	get calloutRetentionPolicy(): Locator {
		return this.root.getByRole('alert', { name: 'Retention policy warning callout' });
	}

	get advancedSettingsAccordion(): Locator {
		return this.root.getByRole('button', { name: 'Advanced settings' });
	}

	get pruneAccordion(): Locator {
		return this.root.getByRole('button', { name: 'Prune', exact: true });
	}

	getMaxAgeLabel(maxAge = '30') {
		return this.root.getByText(`Maximum message age in days (default: ${maxAge})`);
	}

	get inputRetentionMaxAge(): Locator {
		return this.root.locator('input[name="retentionMaxAge"]');
	}

	get checkboxPruneMessages(): Locator {
		return this.root.locator('label', { hasText: 'Automatically prune old messages' });
	}

	get checkboxOverrideGlobalRetention(): Locator {
		return this.root.locator('label', { hasText: 'Override global retention policy' });
	}

	get checkboxIgnoreThreads(): Locator {
		return this.root.locator('label', { hasText: 'Do not prune Threads' });
	}

	get checkboxChannels(): Locator {
		return this.root.locator('label', { hasText: 'Channels' });
	}

	get checkboxDiscussions(): Locator {
		return this.root.locator('label', { hasText: 'Discussions' });
	}

	async toggleSidepanelItems() {
		await this.checkboxChannels.click();
		await this.checkboxDiscussions.click();
	}
}

export class EditTeamFlexTab extends EditRoomFlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Edit team' }));
	}
}

export class OmnichannelEditRoomFlexTab extends EditRoomFlexTab {
	private readonly tagsListbox: Listbox;

	private readonly slaListbox: Listbox;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Edit Room' }));
		this.tagsListbox = new Listbox(page);
		this.slaListbox = new Listbox(page, 'SLA Policy');
	}

	get inputSLAPolicy(): Locator {
		return this.root.getByRole('button', { name: 'SLA Policy', exact: true });
	}

	optionTag(name: string): Locator {
		return this.tagsListbox.getOption(name);
	}

	async selectTag(name: string) {
		await this.tagsListbox.selectOption(name);
	}

	async selectSLA(name: string) {
		await this.inputSLAPolicy.click();
		await this.slaListbox.selectOption(name, true);
	}

	get inputTags(): Locator {
		return this.root.getByRole('textbox', { name: 'Select an option' });
	}
}
