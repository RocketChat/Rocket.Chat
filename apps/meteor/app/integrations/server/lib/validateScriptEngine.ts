import type { IntegrationScriptEngine } from '@rocket.chat/core-typings';
import { wrapExceptions } from '@rocket.chat/tools';

const FREEZE_INTEGRATION_SCRIPTS_VALUE = String(process.env.FREEZE_INTEGRATION_SCRIPTS).toLowerCase();
const FREEZE_INTEGRATION_SCRIPTS = ['yes', 'true'].includes(FREEZE_INTEGRATION_SCRIPTS_VALUE);

export const validateScriptEngine = (engine?: IntegrationScriptEngine) => {
	if (FREEZE_INTEGRATION_SCRIPTS) {
		throw new Error('integration-scripts-disabled');
	}

	const engineCode = engine === 'isolated-vm' ? 'ivm' : 'vm2';

	if (engineCode === FREEZE_INTEGRATION_SCRIPTS_VALUE) {
		if (engineCode === 'ivm') {
			throw new Error('integration-scripts-isolated-vm-disabled');
		}

		throw new Error('integration-scripts-vm2-disabled');
	}

	return true;
};

export const isScriptEngineFrozen = (engine?: IntegrationScriptEngine) =>
	wrapExceptions(() => !validateScriptEngine(engine)).catch(() => true);
