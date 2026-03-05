import type { RequiredField } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import type { ICustomSoundData } from './insertOrUpdateSound';
import { uploadCustomSound } from '../lib/uploadCustomSound';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		uploadCustomSound(binaryContent: string, contentType: string, soundData: RequiredField<ICustomSoundData, '_id'>): void;
	}
}

Meteor.methods<ServerMethods>({
	async uploadCustomSound(binaryContent, contentType, soundData) {
		await uploadCustomSound(this.userId, binaryContent, contentType, soundData);
	},
});
