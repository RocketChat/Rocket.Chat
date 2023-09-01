import { api } from '@rocket.chat/core-services';
import type { IUser, IUpload } from '@rocket.chat/core-typings';
import { FederationService } from '@rocket.chat/federation';

import { FileUpload } from '../../../app/file-upload/server';
import { parseFileIntoMessageAttachments } from '../../../app/file-upload/server/methods/sendFileMessage';
import { _setRealName } from '../../../app/lib/server/functions/setRealName';
import { setUserAvatar } from '../../../app/lib/server/functions/setUserAvatar';
import { slashCommands } from '../../../app/utils/server/slashCommand';
import { isRunningMs } from '../../../server/lib/isRunningMs';
import { LicenseService } from '../../app/license/server/license.internalService';
import { OmnichannelEE } from '../../app/livechat-enterprise/server/services/omnichannel.internalService';
import { EnterpriseSettings } from '../../app/settings/server/settings.internalService';
import { InstanceService } from '../local-services/instance/service';
import { LDAPEEService } from '../local-services/ldap/service';
import { MessageReadsService } from '../local-services/message-reads/service';

// TODO consider registering these services only after a valid license is added
api.registerService(new EnterpriseSettings());
api.registerService(new LDAPEEService());
api.registerService(new LicenseService());
api.registerService(new MessageReadsService());
api.registerService(new OmnichannelEE());

// TODO: move the federation to run in a separated process as soon as we have all the dependencies properly isolated
api.registerService(
	await FederationService.createFederationService(
		{
			setRealName: _setRealName,
			setUserAvatar,
		},
		{
			extractMetadata: FileUpload.extractMetadata.bind(FileUpload),
			getFileBuffer: FileUpload.getBuffer.bind(FileUpload),
			uploadFile: async (readableStream: ReadableStream, internalRoomId: string, internalUser: IUser, fileRecord: Partial<IUpload>) => {
				const fileStore = FileUpload.getStore('Uploads');
				const uploadedFile = await fileStore.insert(fileRecord, readableStream);
				const { files, attachments } = await parseFileIntoMessageAttachments(uploadedFile, internalRoomId, internalUser);

				return { files, attachments };
			},
		},
		slashCommands,
	),
);

// when not running micro services we want to start up the instance intercom
if (!isRunningMs()) {
	void (async (): Promise<void> => {
		api.registerService(new InstanceService());
	})();
}
