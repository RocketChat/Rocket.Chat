import type { IRoom } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useCopyWithToast } from '@rocket.chat/ui-client';
import { useRouter, useSetModal } from '@rocket.chat/ui-contexts';
import type { RouterContextValue } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ConferenceLink } from './ConferenceLink';
import ConferenceLinkModalWithData from './ConferenceLinkModalWithData';
import DeleteConferenceLinkModalWithData from './DeleteConferenceLinkModalWithData';
import type { VideoCallMenuHandlers, VideoCallMenuSections } from './buildVideoCallMenuSections';
import { buildVideoCallMenuSections } from './buildVideoCallMenuSections';
import { absoluteUrl } from '../../../../lib/absoluteUrl';
import { useVideoConfOpenCall } from '../../contextualBar/VideoConference/hooks/useVideoConfOpenCall';

export type UseVideoCallMenuSectionsInput = {
	rid: IRoom['_id'];
	links: readonly ConferenceLink[];
	canStart: boolean;
	canManage: boolean;
	startDisabled: boolean;
	startDisabledReason?: string;
	onStart: () => void;
};

const linkAddress = (router: RouterContextValue, link: ConferenceLink) =>
	absoluteUrl(router.buildRoutePath({ name: 'conference', params: { id: link.url } }));

/** The video call menu of a room, each entry acting on it: opening, copying and managing its conference links. */
export const useVideoCallMenuSections = ({
	rid,
	links,
	canStart,
	canManage,
	startDisabled,
	startDisabledReason,
	onStart,
}: UseVideoCallMenuSectionsInput): VideoCallMenuSections => {
	const { t } = useTranslation();
	const router = useRouter();
	const setModal = useSetModal();
	const handleOpenCall = useVideoConfOpenCall();
	const copy = useCopyWithToast();

	const closeModal = useStableCallback(() => setModal(null));

	// Opened in the click itself: a browser refuses a window opened after waiting on anything.
	const onOpen = useStableCallback((link: ConferenceLink) => {
		handleOpenCall(linkAddress(router, link));
	});

	const onCopy = useStableCallback((link: ConferenceLink) => {
		void copy(linkAddress(router, link));
	});

	const onCreate = useStableCallback(() => setModal(<ConferenceLinkModalWithData mode='create' rid={rid} onClose={closeModal} />));

	const onRename = useStableCallback((link: ConferenceLink) =>
		setModal(<ConferenceLinkModalWithData mode='rename' rid={rid} link={link} onClose={closeModal} />),
	);

	const onDelete = useStableCallback((link: ConferenceLink) =>
		setModal(<DeleteConferenceLinkModalWithData rid={rid} link={link} onClose={closeModal} />),
	);

	const handlers = useMemo<VideoCallMenuHandlers>(
		() => ({ onStart, onCreate, onOpen, onCopy, onRename, onDelete }),
		[onStart, onCreate, onOpen, onCopy, onRename, onDelete],
	);

	return useMemo(
		() => buildVideoCallMenuSections({ links, canStart, canManage, startDisabled, startDisabledReason, handlers, t }),
		[links, canStart, canManage, startDisabled, startDisabledReason, handlers, t],
	);
};
