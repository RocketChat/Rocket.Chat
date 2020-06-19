import { callbacks } from '../../../callbacks/server';

const callbackDefinitions = [];

export function registerCallback(callbackDefition) {
	callbackDefinitions.push(callbackDefition);
}

export function enableCallbacks() {
	for (const definition of callbackDefinitions) {
		callbacks.add(definition.hook, definition.callback, callbacks.priority.LOW, definition.id);
	}
}

export function disableCallbacks() {
	for (const definition of callbackDefinitions) {
		callbacks.remove(definition.hook, definition.id);
	}
}
