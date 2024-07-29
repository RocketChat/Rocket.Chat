import type { ICustomSound } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { CustomSounds } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		listCustomSounds(): ICustomSound[];
	}
}

Meteor.methods<ServerMethods>({
	async listCustomSounds() {
		return CustomSounds.find({}).toArray();
	},
});
