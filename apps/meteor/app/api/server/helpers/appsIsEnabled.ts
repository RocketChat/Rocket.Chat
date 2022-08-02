import { SettingValue } from '@rocket.chat/core-typings';

import { AppServerOrchestrator } from '../../../apps/server/orchestrator';
import { API } from '../api';

API.helperMethods.set('/apps/is-enabled', function _isEnabled(this: { orch: AppServerOrchestrator; [key: string]: unknown }): SettingValue {
	return typeof this.orch !== 'undefined' && this.orch.isEnabled();
});
