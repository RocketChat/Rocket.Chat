import { OptionTitle } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useSetting, useAtLeastOnePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { popover } from '../../../../app/ui-utils/client';
import CreateDiscussion from '../../../components/CreateDiscussion';
import ListItem from '../../../components/Sidebar/ListItem';
import CreateTeamModal from '../../../views/teams/CreateTeamModal';
import CreateChannelWithData from '../CreateChannelWithData';
import CreateDirectMessage from '../CreateDirectMessage';

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

function CreateRoomList({ closeList }) {
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
		<>
			<OptionTitle pb='x8' style={style}>
				{t('Create_new')}
			</OptionTitle>
			<ul className='rc-popover__list'>
				{canCreateChannel && (
					<ListItem
						icon='hashtag'
						text={t('Channel')}
						action={(e) => {
							createChannel(e);
							closeList();
						}}
					/>
				)}
				{canCreateTeam && (
					<ListItem
						icon='team'
						text={t('Team')}
						action={(e) => {
							createTeam(e);
							closeList();
						}}
					/>
				)}
				{canCreateDirectMessages && (
					<ListItem
						icon='balloon'
						text={t('Direct_Messages')}
						action={(e) => {
							createDirectMessage(e);
							closeList();
						}}
					/>
				)}
				{discussionEnabled && canCreateDiscussion && (
					<ListItem
						icon='discussion'
						text={t('Discussion')}
						action={(e) => {
							createDiscussion(e);
							closeList();
						}}
					/>
				)}
			</ul>
		</>
	);
}

export default CreateRoomList;
