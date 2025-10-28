import type { IMessage } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useUser } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { downloadJsonAs } from '../../../../lib/download';
import { Messages } from '../../../../stores';
import { useRoom } from '../../contexts/RoomContext';

export const useDownloadExportMutation = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const user = useUser();
	const dispatchToastMessage = useToastMessageDispatch();

	const filterMessages = Messages.use((state) => state.filter);

	return useMutation({
		mutationFn: async ({ mids }: { mids: IMessage['_id'][] }) => {
			const messages = filterMessages((record) => mids.includes(record._id) || (!!record.tmid && mids.includes(record.tmid))).map(
				({ _id, ts, u, msg, _updatedAt, tlm, replies, tmid, attachments }) => ({
					_id,
					ts,
					u,
					msg,
					_updatedAt,
					tlm,
					replies,
					tmid,
					attachments:
						attachments?.map((attachment) => ({
							ts: attachment.ts,
							title: attachment.title,
							title_link: attachment.title_link,
							title_link_download: attachment.title_link_download,
							...('image_dimensions' in attachment && { image_dimensions: attachment.image_dimensions }),
							...('image_preview' in attachment && { image_preview: attachment.image_preview }),
							...('image_url' in attachment && { image_url: attachment.image_url }),
							...('image_type' in attachment && { image_type: attachment.image_type }),
							...('image_size' in attachment && { image_size: attachment.image_size }),
							...('type' in attachment && { type: attachment.type }),
							description: attachment.description,
						})) ?? [],
				}),
			);

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
