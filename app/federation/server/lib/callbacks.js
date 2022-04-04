import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';

const callbackDefinitions = [];

function enableCallback(definition) {
	callbacks.add(definition.hook, definition.callback, callbacks.priority.LOW, definition.id);
}

export function registerCallback(callbackDefinition) {
	callbackDefinitions.push(callbackDefinition);

	if (settings.get('FEDERATION_Enabled')) {
		enableCallback(callbackDefinition);
	}
}

export function enableCallbacks() {
	for (const definition of callbackDefinitions) {
		enableCallback(definition);
	}
}

export function disableCallbacks() {
	for (const definition of callbackDefinitions) {
		callbacks.remove(definition.hook, definition.id);
	}
}
