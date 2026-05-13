import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';

import { AppDetailChangesBridge } from '../../../src/server/bridges';

export class TestsAppDetailChangesBridge extends AppDetailChangesBridge {
	public onAppSettingsChange(appId: string, setting: ISetting): void {}
}
