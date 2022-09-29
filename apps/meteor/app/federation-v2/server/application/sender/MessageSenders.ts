import type { IMessage } from '@rocket.chat/core-typings';

import type { IFederationBridge } from '../../domain/IFederationBridge';
import type { RocketChatFileAdapter } from '../../infrastructure/rocket-chat/adapters/File';
import type { RocketChatMessageAdapter } from '../../infrastructure/rocket-chat/adapters/Message';

export interface IExternalMessageSender {
	sendMessage(externalRoomId: string, externalSenderId: string, message: IMessage): Promise<void>;
}

class TextExternalMessageSender implements IExternalMessageSender {
	constructor(private readonly bridge: IFederationBridge, private readonly internalMessageAdapter: RocketChatMessageAdapter) {}

	public async sendMessage(externalRoomId: string, externalSenderId: string, message: IMessage): Promise<void> {
		const externalMessageId = await this.bridge.sendMessage(externalRoomId, externalSenderId, message);

		await this.internalMessageAdapter.setExternalFederationEventOnMessage(message._id, externalMessageId);
	}
}

class FileExternalMessageSender implements IExternalMessageSender {
	constructor(
		private readonly bridge: IFederationBridge,
		private readonly internalFileHelper: RocketChatFileAdapter,
		private readonly internalMessageAdapter: RocketChatMessageAdapter,
	) {}

	public async sendMessage(externalRoomId: string, externalSenderId: string, message: IMessage): Promise<void> {
		const file = await this.internalFileHelper.getFileRecordById((message.files || [])[0]?._id);
		if (!file || !file.size || !file.type) {
			return;
		}

		const buffer = await this.internalFileHelper.getBufferFromFileRecord(file);
		const metadata = await this.internalFileHelper.extractMetadataFromFile(file);

		const externalMessageId = await this.bridge.sendMessageFileToRoom(externalRoomId, externalSenderId, buffer, {
			filename: file.name,
			fileSize: file.size,
			mimeType: file.type,
			metadata: {
				width: metadata?.width,
				height: metadata?.height,
				format: metadata?.format,
			},
		});

		await this.internalMessageAdapter.setExternalFederationEventOnMessage(message._id, externalMessageId);
	}
}

export const getExternalMessageSender = (
	message: IMessage,
	bridge: IFederationBridge,
	internalFileHelper: RocketChatFileAdapter,
	internalMessageAdapter: RocketChatMessageAdapter,
): IExternalMessageSender => {
	return message.files
		? new FileExternalMessageSender(bridge, internalFileHelper, internalMessageAdapter)
		: new TextExternalMessageSender(bridge, internalMessageAdapter);
};
