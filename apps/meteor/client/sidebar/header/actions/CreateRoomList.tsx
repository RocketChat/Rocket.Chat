import { OptionTitle } from '@rocket.chat/fuselage';
import { useSetting, useAtLeastOnePermission, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, MouseEvent } from 'react';
import React from 'react';

import CreateDiscussion from '../../../components/CreateDiscussion';
import ListItem from '../../../components/Sidebar/ListItem';
import CreateChannelWithData from '../CreateChannel';
import CreateDirectMessage from '../CreateDirectMessage';
import CreateTeam from '../CreateTeam';
import { useCreateRoomModal } from '../hooks/useCreateRoomModal';

const CREATE_CHANNEL_PERMISSIONS = ['create-c', 'create-p'];
const CREATE_TEAM_PERMISSIONS = ['create-team'];
const CREATE_DIRECT_PERMISSIONS = ['create-d'];
const CREATE_DISCUSSION_PERMISSIONS = ['start-discussion', 'start-discussion-other-user'];

type CreateRoomListProps = {
	closeList: () => void;
};

const CreateRoomList = ({ closeList }: CreateRoomListProps): ReactElement => {
	const t = useTranslation();
	const discussionEnabled = useSetting('Discussion_enabled');

	const canCreateChannel = useAtLeastOnePermission(CREATE_CHANNEL_PERMISSIONS);
	const canCreateTeam = useAtLeastOnePermission(CREATE_TEAM_PERMISSIONS);
	const canCreateDirectMessages = useAtLeastOnePermission(CREATE_DIRECT_PERMISSIONS);
	const canCreateDiscussion = useAtLeastOnePermission(CREATE_DISCUSSION_PERMISSIONS);

	const createChannel = useCreateRoomModal(CreateChannelWithData);
	const createTeam = useCreateRoomModal(CreateTeam);
	const createDiscussion = useCreateRoomModal(CreateDiscussion);
	const createDirectMessage = useCreateRoomModal(CreateDirectMessage);

	return (
		<>
			<OptionTitle>{t('Create_new')}</OptionTitle>
			<ul>
				{canCreateChannel && (
					<ListItem
						role='listitem'
						icon='hashtag'
						text={t('Channel')}
						onClick={(e: MouseEvent<HTMLElement>): void => {
							createChannel(e);
							closeList();
						}}
					/>
				)}
				{canCreateTeam && (
					<ListItem
						role='listitem'
						icon='team'
						text={t('Team')}
						onClick={(e: MouseEvent<HTMLElement>): void => {
							createTeam(e);
							closeList();
						}}
					/>
				)}
				{canCreateDirectMessages && (
					<ListItem
						role='listitem'
						icon='balloon'
						text={t('Direct_Messages')}
						onClick={(e: MouseEvent<HTMLElement>): void => {
							createDirectMessage(e);
							closeList();
						}}
					/>
				)}
				{discussionEnabled && canCreateDiscussion && (
					<ListItem
						role='listitem'
						icon='discussion'
						text={t('Discussion')}
						onClick={(e: MouseEvent<HTMLElement>): void => {
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
