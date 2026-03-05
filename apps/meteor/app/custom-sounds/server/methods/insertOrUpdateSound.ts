import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { insertOrUpdateSound } from '../lib/insertOrUpdateSound';

export type ICustomSoundData = {
	_id?: string;
	name: string;
	extension: string;
	previousName?: string;
	previousSound?: {
		extension?: string;
	};
	previousExtension?: string;
	newFile?: boolean;
	random?: number;
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		insertOrUpdateSound(soundData: ICustomSoundData): Promise<string>;
	}
}

Meteor.methods<ServerMethods>({
	async insertOrUpdateSound(soundData) {
		return insertOrUpdateSound(this.userId, soundData);
	},
});
