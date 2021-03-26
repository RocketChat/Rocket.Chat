import { Box, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { modal, popover } from '../../../../app/ui-utils';
import { useAtLeastOnePermission, usePermission } from '../../../contexts/AuthorizationContext';
import { useSetModal } from '../../../contexts/ModalContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import CreateTeamModal from '../../../views/teams/modals/CreateTeamModal';
import CreateChannel from '../CreateChannel';
import CreateRoomListItem from './CreateRoomListItem';

const CREATE_CHANNEL_PERMISSIONS = ['create-c', 'create-p'];

const CREATE_TEAM_PERMISSIONS = ['create-team'];

const CREATE_DISCUSSION_PERMISSIONS = ['start-discussion', 'start-discussion-other-user'];

const style = {
	textTransform: 'uppercase',
};

const useAction = (title, content) =>
	useMutableCallback((e) => {
		e.preventDefault();
		popover.close();
		modal.open({
			title,
			content,
			data: {
				onCreate() {
					modal.close();
				},
			},
			modifier: 'modal',
			showConfirmButton: false,
			showCancelButton: false,
			confirmOnEnter: false,
		});
	});

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
	const canCreateDirectMessages = usePermission('create-d');
	const canCreateDiscussion = useAtLeastOnePermission(CREATE_DISCUSSION_PERMISSIONS);

	const createChannel = useReactModal(CreateChannel);
	const createTeam = useReactModal(CreateTeamModal);
	const createDirectMessage = useAction(t('Direct_Messages'), 'CreateDirectMessage');
	const createDiscussion = useAction(t('Discussion_title'), 'CreateDiscussion');

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
