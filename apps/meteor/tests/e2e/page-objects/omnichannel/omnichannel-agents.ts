import type { Locator, Page } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';
import { FlexTab } from '../fragments/flextab';
import { Listbox } from '../fragments/listbox';
import { Table } from '../fragments/table';

class OmnichannelEditAgentFlexTab extends FlexTab {
	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'User Info' }));
		this.listbox = new Listbox(page.getByRole('listbox'));
	}

	get inputMaxChats(): Locator {
		return this.root.locator('input[name="maxNumberSimultaneousChat"]');
	}

	get inputDepartment(): Locator {
		return this.root.getByLabel('Departments').getByRole('textbox');
	}

	getDepartmentOption(name: string) {
		return this.listbox.getOption(name);
	}

	async selectDepartment(name: string) {
		await this.inputDepartment.click();
		await this.inputDepartment.fill(name);
		await this.listbox.selectOption(name);
		// TODO: This is necessary due to the PaginatedMultiSelectFiltered not closing the list when an option is selected nor when close is clicked.
		// The line below can be removed once the component is adjusted in Fuselage
		await this.root.click();
	}

	findSelectedDepartment(name: string) {
		return this.root.getByLabel('Departments', { exact: true }).getByRole('option', { name });
	}

	get inputStatus(): Locator {
		return this.root.locator('[data-qa-id="agent-edit-status"]');
	}

	async selectStatus(status: string) {
		await this.inputStatus.click();
		await this.root.locator(`.rcx-option__content:has-text("${status}")`).click();
	}
}

class OmnichannelAgentInfoFlexTab extends FlexTab {
	get btnEdit(): Locator {
		return this.root.getByRole('button', { name: 'Edit', exact: true });
	}

	get btnRemove(): Locator {
		return this.root.getByRole('button', { name: 'Remove' });
	}
}

class OmnichannelAgentsTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Agents' }));
	}
}

export class OmnichannelAgents extends OmnichannelAdmin {
	readonly editAgent: OmnichannelEditAgentFlexTab;

	readonly agentInfo: OmnichannelAgentInfoFlexTab;

	readonly table: OmnichannelAgentsTable;

	constructor(page: Page) {
		super(page);
		this.editAgent = new OmnichannelEditAgentFlexTab(page);
		this.agentInfo = new OmnichannelAgentInfoFlexTab(page.getByRole('dialog', { name: 'User Info' }));
		this.table = new OmnichannelAgentsTable(page);
	}

	get inputUsername(): Locator {
		return this.page.locator('[data-qa-id="UserAutoComplete"]');
	}

	get btnAdd(): Locator {
		return this.page.locator('role=button[name="Add agent"]');
	}

	async deleteAgent(name: string) {
		await this.search(name);
		await this.table.findRowByName(name).getByRole('button', { name: 'Remove' }).click();
		await this.deleteModal.confirmDelete();
	}

	get scrollContainer(): Locator {
		return this.page.locator('#position-container').getByTestId('virtuoso-scroller');
	}

	scrollToListBottom() {
		return this.scrollContainer.evaluate((el) => {
			el.scrollTop = el.scrollHeight;
			el.dispatchEvent(new Event('scroll'));
		});
	}

	async selectUsername(username: string) {
		await this.inputUsername.fill(username);
		await this.page.locator(`role=option[name="${username}"]`).click();
	}
}
