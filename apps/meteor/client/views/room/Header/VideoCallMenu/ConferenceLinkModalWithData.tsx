import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { ConferenceLink } from './ConferenceLink';
import ConferenceLinkModal from './ConferenceLinkModal';
import { conferenceLinkErrorKey } from './conferenceLinkErrorKey';
import { videoConferenceQueryKeys } from '../../../../lib/queryKeys';

export type ConferenceLinkModalWithDataProps = { rid: IRoom['_id']; onClose: () => void } & (
	{ mode: 'create'; link?: never } | { mode: 'rename'; link: ConferenceLink }
);

const ConferenceLinkModalWithData = ({ mode, rid, link, onClose }: ConferenceLinkModalWithDataProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const createLink = useEndpoint('POST', '/v1/video-conference.rooms.create');
	const renameLink = useEndpoint('POST', '/v1/video-conference.rooms.rename');

	const { mutate, isPending, error } = useMutation({
		mutationFn: async (title: string) => {
			if (link) {
				await renameLink({ conferenceRoomId: link._id, title });
				return;
			}

			await createLink({ roomId: rid, title });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t(link ? 'Conference_link_renamed' : 'Conference_link_created') });
			onClose();
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.persistentRooms(rid) }),
	});

	return (
		<ConferenceLinkModal
			mode={mode}
			initialTitle={link?.title}
			onConfirm={(title) => mutate(title)}
			onClose={onClose}
			isPending={isPending}
			error={error ? t(conferenceLinkErrorKey(error)) : undefined}
		/>
	);
};

export default ConferenceLinkModalWithData;
