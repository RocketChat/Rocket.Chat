import { Expect, SetupFixture, Test } from 'alsatian';

import type { IAppStorageItem } from '../../../server/storage';
import type { ISlashCommand } from '../../../src/definition/slashcommands';
import type { AppManager } from '../../../src/server/AppManager';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import { AppSlashCommand } from '../../../src/server/managers/AppSlashCommand';
import { TestData } from '../../test-data/utilities';

export class AppSlashCommandRegistrationTestFixture {
	private mockApp: ProxiedApp;

	@SetupFixture
	public setupFixture() {
		this.mockApp = TestData.getMockApp({ info: { id: 'test', name: 'TestApp' } } as IAppStorageItem, {} as AppManager);
	}

	@Test()
	public ensureAppSlashCommand() {
		Expect(() => new AppSlashCommand(this.mockApp, {} as ISlashCommand)).not.toThrow();

		const ascr = new AppSlashCommand(this.mockApp, {} as ISlashCommand);
		Expect(ascr.isRegistered).toBe(false);
		Expect(ascr.isEnabled).toBe(false);
		Expect(ascr.isDisabled).toBe(false);

		ascr.hasBeenRegistered();
		Expect(ascr.isDisabled).toBe(false);
		Expect(ascr.isEnabled).toBe(true);
		Expect(ascr.isRegistered).toBe(true);
	}
}
