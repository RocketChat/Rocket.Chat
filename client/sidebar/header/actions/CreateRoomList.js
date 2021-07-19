import { Box, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { popover } from '../../../../app/ui-utils/client';
import CreateDiscussion from '../../../components/CreateDiscussion';
import { useAtLeastOnePermission } from '../../../contexts/AuthorizationContext';
import { useSetModal } from '../../../contexts/ModalContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import CreateTeamModal from '../../../views/teams/CreateTeamModal';
import CreateChannelWithData from '../CreateChannelWithData';
import CreateDirectMessage from '../CreateDirectMessage';
import CreateRoomListItem from './CreateRoomListItem';

const CREATE_CHANNEL_PERMISSIONS = ['create-c', 'create-p'];
const CREATE_TEAM_PERMISSIONS = ['create-team'];
const CREATE_DIRECT_PERMISSIONS = ['create-d'];
const CREATE_DISCUSSION_PERMISSIONS = ['start-discussion', 'start-discussion-other-user'];

const style = {
	textTransform: 'uppercase',
};

const useReactModal = (Component) => {
	const setModal = useSetModal();

	return useMutableCallback((e) => {
		popover.close();

		e.preventDefault();

		const handleClose = () => {
			setModal(null);
		};

		setModal(() => <Component onClose={handleClose} />);
	});
};

function CreateRoomList() {
	const t = useTranslation();

	const canCreateChannel = useAtLeastOnePermission(CREATE_CHANNEL_PERMISSIONS);
	const canCreateTeam = useAtLeastOnePermission(CREATE_TEAM_PERMISSIONS);
	const canCreateDirectMessages = useAtLeastOnePermission(CREATE_DIRECT_PERMISSIONS);
	const canCreateDiscussion = useAtLeastOnePermission(CREATE_DISCUSSION_PERMISSIONS);

	const createChannel = useReactModal(CreateChannelWithData);
	const createTeam = useReactModal(CreateTeamModal);
	const createDiscussion = useReactModal(CreateDiscussion);
	const createDirectMessage = useReactModal(CreateDirectMessage);

	const discussionEnabled = useSetting('Discussion_enabled');

	return (
		<div className='rc-popover__column'>
			<Margins block='x8'>
				<Box is='p' style={style} fontScale='micro'>
					{t('Create_new')}
				</Box>
			</Margins>
			<ul className='rc-popover__list'>
				<Margins block='x8'>
					{canCreateChannel && (
						<CreateRoomListItem icon='hashtag' text={t('Channel')} action={createChannel} />
					)}
					{canCreateTeam && <CreateRoomListItem icon='team' text={t('Team')} action={createTeam} />}
					{canCreateDirectMessages && (
						<CreateRoomListItem
							icon='balloon'
							text={t('Direct_Messages')}
							action={createDirectMessage}
						/>
					)}
					{discussionEnabled && canCreateDiscussion && (
						<CreateRoomListItem
							icon='discussion'
							text={t('Discussion')}
							action={createDiscussion}
						/>
					)}
				</Margins>
			</ul>
		</div>
	);
}

export default CreateRoomList;
