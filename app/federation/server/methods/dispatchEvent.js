import { receiveEvent } from './receiveEvent';

export function dispatchEvent(server, event) {
	receiveEvent(server, event);
}
