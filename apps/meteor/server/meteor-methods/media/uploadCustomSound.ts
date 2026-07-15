import type { RequiredField } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import type { ICustomSoundData } from './insertOrUpdateSound';
import { methodDeprecationLogger } from '../../../app/lib/server/lib/deprecationWarningLogger';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { uploadCustomSound } from '../../lib/media/custom-sounds/lib/uploadCustomSound';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		uploadCustomSound(binaryContent: string, contentType: string, soundData: RequiredField<ICustomSoundData, '_id'>): void;
	}
}

Meteor.methods<ServerMethods>({
	async uploadCustomSound(binaryContent, contentType, soundData) {
		methodDeprecationLogger.method('uploadCustomSound', '9.0.0', ['/v1/custom-sounds.create', '/v1/custom-sounds.update']);
		if (!this.userId || !(await hasPermissionAsync(this.userId, 'manage-sounds'))) {
			throw new Meteor.Error('not_authorized');
		}
		const buffer = Buffer.from(binaryContent, 'binary');
		await uploadCustomSound(buffer, contentType, soundData);
	},
});
