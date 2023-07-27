import type { ICustomSound } from '@rocket.chat/core-typings';
import { CustomSounds } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ui-contexts' {
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
