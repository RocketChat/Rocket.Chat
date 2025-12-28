import type { IntegrationScriptEngine } from '@rocket.chat/core-typings';
import { wrapExceptions } from '@rocket.chat/tools';

const FREEZE_INTEGRATION_SCRIPTS_VALUE = String(process.env.FREEZE_INTEGRATION_SCRIPTS).toLowerCase();
const FREEZE_INTEGRATION_SCRIPTS = ['yes', 'true'].includes(FREEZE_INTEGRATION_SCRIPTS_VALUE);

export const validateScriptEngine = (engine?: IntegrationScriptEngine) => {
	if (FREEZE_INTEGRATION_SCRIPTS) {
		throw new Error('integration-scripts-disabled');
	}

	if (engine && engine !== 'isolated-vm') {
		throw new Error('integration-scripts-unknown-engine');
	}

	const engineCode = 'ivm';

	if (engineCode === FREEZE_INTEGRATION_SCRIPTS_VALUE) {
		throw new Error('integration-scripts-isolated-vm-disabled');
	}

	return true;
};

export const isScriptEngineFrozen = (engine?: IntegrationScriptEngine) =>
	wrapExceptions(() => !validateScriptEngine(engine)).catch(() => true);
