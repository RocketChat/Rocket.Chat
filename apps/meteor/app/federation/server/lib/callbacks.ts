import { callbacks } from '../../../../lib/callbacks';
import type { Hook } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';

type CallbackDefinition = {
	hook: Hook;
	callback: (...args: any[]) => any;
	id: string;
};

const callbackDefinitions: CallbackDefinition[] = [];

function enableCallback(definition: CallbackDefinition): void {
	callbacks.add(definition.hook, definition.callback, callbacks.priority.LOW, definition.id);
}

export function registerCallback(callbackDefinition: CallbackDefinition) {
	callbackDefinitions.push(callbackDefinition);

	if (settings.get<boolean>('FEDERATION_Enabled')) {
		enableCallback(callbackDefinition);
	}
}

export function enableCallbacks(): void {
	for (const definition of callbackDefinitions) {
		enableCallback(definition);
	}
}

export function disableCallbacks(): void {
	for (const definition of callbackDefinitions) {
		callbacks.remove(definition.hook, definition.id);
	}
}
