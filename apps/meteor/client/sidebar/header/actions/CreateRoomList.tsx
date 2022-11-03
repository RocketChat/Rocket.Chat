import { OptionTitle } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useSetting, useAtLeastOnePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

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

type CreateRoomListProps = {
	closeList: () => void;
};

const useReactModal = (Component: FC<any>): ((e: React.MouseEvent<HTMLElement>) => void) => {
	const setModal = useSetModal();

	return useMutableCallback((e) => {
		popover.close();

		e.preventDefault();

		const handleClose = (): void => {
			setModal(null);
		};

		setModal(() => <Component onClose={handleClose} />);
	});
};

const CreateRoomList: FC<CreateRoomListProps> = ({ closeList }) => {
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
			<OptionTitle>{t('Create_new')}</OptionTitle>
			<ul>
				{canCreateChannel && (
					<ListItem
						icon='hashtag'
						text={t('Channel')}
						action={(e: React.MouseEvent<HTMLElement>): void => {
							createChannel(e);
							closeList();
						}}
					/>
				)}
				{canCreateTeam && (
					<ListItem
						icon='team'
						text={t('Team')}
						action={(e: React.MouseEvent<HTMLElement>): void => {
							createTeam(e);
							closeList();
						}}
					/>
				)}
				{canCreateDirectMessages && (
					<ListItem
						icon='balloon'
						text={t('Direct_Messages')}
						action={(e: React.MouseEvent<HTMLElement>): void => {
							createDirectMessage(e);
							closeList();
						}}
					/>
				)}
				{discussionEnabled && canCreateDiscussion && (
					<ListItem
						icon='discussion'
						text={t('Discussion')}
						action={(e: React.MouseEvent<HTMLElement>): void => {
							createDiscussion(e);
							closeList();
						}}
					/>
				)}
			</ul>
		</>
	);
};

export default CreateRoomList;
