import type { IMessage } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useUser } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { FindOptions } from 'mongodb';
import { useTranslation } from 'react-i18next';

import { Messages } from '../../../../../app/models/client';
import { downloadJsonAs } from '../../../../lib/download';
import { useRoom } from '../../contexts/RoomContext';

const messagesFields: FindOptions<IMessage> = {
	projection: {
		'_id': 1,
		'ts': 1,
		'u': 1,
		'msg': 1,
		'_updatedAt': 1,
		'tlm': 1,
		'replies': 1,
		'tmid': 1,
		'attachments.ts': 1,
		'attachments.title': 1,
		'attachments.title_link': 1,
		'attachments.title_link_download': 1,
		'attachments.image_dimensions': 1,
		'attachments.image_preview': 1,
		'attachments.image_url': 1,
		'attachments.image_type': 1,
		'attachments.image_size': 1,
		'attachments.type': 1,
		'attachments.description': 1,
	},
};

export const useDownloadExportMutation = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const user = useUser();
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: async ({ mids }: { mids: IMessage['_id'][] }) => {
			const messages = Messages.find(
				{
					$or: [{ _id: { $in: mids } }, { tmid: { $in: mids } }],
				},
				messagesFields,
			).fetch();

			const fileData = {
				roomId: room._id,
				roomName: room.fname || room.name,
				userExport: {
					id: user?._id,
					username: user?.username,
					name: user?.name,
					roles: user?.roles,
				},
				exportDate: new Date().toISOString(),
				messages,
			};

			return downloadJsonAs(fileData, `exportedMessages-${new Date().toISOString()}`);
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Messages_exported_successfully') });
		},
	});
};
