import type { IMessage } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useUser } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Messages } from '../../../../../app/models/client';
import { downloadJsonAs } from '../../../../lib/download';
import { useRoom } from '../../contexts/RoomContext';

const messagesFields = { _id: 1, ts: 1, u: 1, msg: 1, _updatedAt: 1, tlm: 1, replies: 1, tmid: 1 };

export const useDownloadExportMutation = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const user = useUser();
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: async ({ mids }: { mids: IMessage['_id'][] }) => {
			const messages = Messages.find(
				{
					_id: { $in: mids },
				},
				{ projection: messagesFields },
			).fetch();

			const fileData = {
				roomId: room._id,
				roomName: room.fname || room.name,
				messages,
				exportDate: new Date().toISOString(),
				userExport: {
					id: user?._id,
					username: user?.username,
					name: user?.name,
					roles: user?.roles,
				},
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
