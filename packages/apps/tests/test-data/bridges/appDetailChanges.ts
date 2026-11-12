import type { ISetting } from '@rocket.chat/apps-engine/definition/settings/index.js';

import { AppDetailChangesBridge } from '../../../src/server/bridges/index.js';

export class TestsAppDetailChangesBridge extends AppDetailChangesBridge {
	public onAppSettingsChange(appId: string, setting: ISetting): void {}
}
