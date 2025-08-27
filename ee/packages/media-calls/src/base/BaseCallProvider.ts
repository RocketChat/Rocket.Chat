import type { IMediaCall } from '@rocket.chat/core-typings';

export class BaseCallProvider {
	public get callId(): string {
		return this.call._id;
	}

	constructor(public readonly call: IMediaCall) {}
}
