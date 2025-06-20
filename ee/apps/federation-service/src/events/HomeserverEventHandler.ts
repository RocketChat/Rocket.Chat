import { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures } from '@rocket.chat/homeserver';
import { registerEvents } from './events';

export class HomeserverEventHandler {
	private emitter: Emitter<HomeserverEventSignatures>;

	constructor() {
		this.emitter = new Emitter<HomeserverEventSignatures>();
		registerEvents(this.emitter);
	}

	public getEmitter(): Emitter<HomeserverEventSignatures> {
		return this.emitter;
	}

	public destroy(): void {
		this.emitter = new Emitter<HomeserverEventSignatures>();
		console.log('Homeserver event listeners destroyed');
	}
}