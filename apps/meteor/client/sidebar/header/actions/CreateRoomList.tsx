import { OptionTitle, OptionDivider } from '@rocket.chat/fuselage';
import { useSetting, useAtLeastOnePermission, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, MouseEvent } from 'react';
import React from 'react';

import CreateDiscussion from '../../../components/CreateDiscussion';
import ListItem from '../../../components/Sidebar/ListItem';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import CreateChannelWithData from '../CreateChannel';
import CreateDirectMessage from '../CreateDirectMessage';
import CreateTeam from '../CreateTeam';
import MatrixFederationSearch from '../MatrixFederationSearch';
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
	const searchFederatedRooms = useCreateRoomModal(MatrixFederationSearch);

	const { data } = useIsEnterprise();
	const isMatrixEnabled = useSetting('Federation_Matrix_enabled') && data?.isEnterprise;

	return (
		<>
			<OptionTitle>{t('Create_new')}</OptionTitle>
			<ul>
				{canCreateChannel && (
					<ListItem
						icon='hashtag'
						text={t('Channel')}
						action={(e: MouseEvent<HTMLElement>): void => {
							createChannel(e);
							closeList();
						}}
					/>
				)}
				{canCreateTeam && (
					<ListItem
						icon='team'
						text={t('Team')}
						action={(e: MouseEvent<HTMLElement>): void => {
							createTeam(e);
							closeList();
						}}
					/>
				)}
				{canCreateDirectMessages && (
					<ListItem
						icon='balloon'
						text={t('Direct_Messages')}
						action={(e: MouseEvent<HTMLElement>): void => {
							createDirectMessage(e);
							closeList();
						}}
					/>
				)}
				{discussionEnabled && canCreateDiscussion && (
					<ListItem
						icon='discussion'
						text={t('Discussion')}
						action={(e: MouseEvent<HTMLElement>): void => {
							createDiscussion(e);
							closeList();
						}}
					/>
				)}
				{isMatrixEnabled && (
					<>
						<OptionDivider />
						<OptionTitle>{t('Explore')}</OptionTitle>
						<ListItem
							icon='magnifier'
							text={t('Federation_Search_federated_rooms')}
							action={(e: MouseEvent<HTMLElement>): void => {
								searchFederatedRooms(e);
								closeList();
							}}
						/>
					</>
				)}
			</ul>
		</>
	);
};

export default CreateRoomList;
