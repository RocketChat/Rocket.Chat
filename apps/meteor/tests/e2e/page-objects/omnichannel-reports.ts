import type { Locator, Page } from '@playwright/test';

class OmnichannelReportsSection {
	private readonly page: Page;

	private readonly section: Locator;

	constructor(page: Page, sectionId: string) {
		this.page = page;
		this.section = page.locator(`[data-qa=${sectionId}]`);
	}

	get element() {
		return this.section;
	}

	get inputPeriodSelector() {
		return this.section.locator('button', { has: this.page.locator('select[name="periodSelector"]') });
	}

	get txtTitle() {
		return this.section.locator('');
	}

	get txtDescription() {
		return this.section.locator('');
	}

	get chart() {
		return this.section.locator('');
	}

	get txtStateTitle() {
		return this.section.locator('.rcx-states__title');
	}

	get txtStateSubtitle() {
		return this.section.locator('.rcx-states__subtitle');
	}

	get btnRetry() {
		return this.section.locator('role=button[name="Retry"]');
	}

	get txtSummary() {
		return this.section.locator('[data-qa="report-summary"]');
	}

	get loadingSkeleton() {
		return this.section.locator('.rcx-skeleton');
	}

	findRowByName(name: string) {
		return this.section.locator('tr', { has: this.page.locator(`td >> text="${name}"`) });
	}

	chartItem(label: string, value: number) {
		return this.section.locator(`rect[aria-label="${label}"] + text >> text=${value}`);
	}

	legendItem(text: string) {
		return this.section.locator(`text='${text}'`);
	}

	async selectPeriod(period: string) {
		await this.inputPeriodSelector.click();
		await this.page.locator(`li.rcx-option[data-key="${period}"]`).click();
	}
}

export class OmnichannelReports {
	readonly statusSection: OmnichannelReportsSection;

	readonly channelsSection: OmnichannelReportsSection;

	readonly departmentsSection: OmnichannelReportsSection;

	readonly tagsSection: OmnichannelReportsSection;

	readonly agentsSection: OmnichannelReportsSection;

	constructor(page: Page) {
		this.statusSection = new OmnichannelReportsSection(page, 'conversations-by-status');
		this.channelsSection = new OmnichannelReportsSection(page, 'conversations-by-channel');
		this.departmentsSection = new OmnichannelReportsSection(page, 'conversations-by-department');
		this.tagsSection = new OmnichannelReportsSection(page, 'conversations-by-tags');
		this.agentsSection = new OmnichannelReportsSection(page, 'conversations-by-agent');
	}
}
