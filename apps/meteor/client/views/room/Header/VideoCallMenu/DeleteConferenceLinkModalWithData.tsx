import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpointMutation } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { ConferenceLink } from './ConferenceLink';
import DeleteConferenceLinkModal from './DeleteConferenceLinkModal';
import { conferenceLinkErrorKey } from './conferenceLinkErrorKey';
import { videoConferenceQueryKeys } from '../../../../lib/queryKeys';

export type DeleteConferenceLinkModalWithDataProps = {
	rid: IRoom['_id'];
	link: ConferenceLink;
	onClose: () => void;
};

const DeleteConferenceLinkModalWithData = ({ rid, link, onClose }: DeleteConferenceLinkModalWithDataProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const { mutate, isPending } = useEndpointMutation('POST', '/v1/video-conference.rooms.delete', {
		onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Conference_link_deleted') }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: t(conferenceLinkErrorKey(error)) }),
		onSettled: () => {
			onClose();
			return queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.persistentRooms(rid) });
		},
	});

	return (
		<DeleteConferenceLinkModal
			linkTitle={link.title}
			onConfirm={() => mutate({ conferenceRoomId: link._id })}
			onClose={onClose}
			isPending={isPending}
		/>
	);
};

export default DeleteConferenceLinkModalWithData;
