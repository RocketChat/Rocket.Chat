import React from 'react';
import { Box, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';


import { modal } from '../../../../app/ui-utils';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useAtLeastOnePermission, usePermission } from '../../../contexts/AuthorizationContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useSetModal } from '../../../contexts/ModalContext';
import CreateChannel from '../CreateChannel';
import CreateRoomListItem from './CreateRoomListItem';

const CREATE_CHANNEL_PERMISSIONS = ['create-c', 'create-p'];

const CREATE_DISCUSSION_PERMISSIONS = ['start-discussion', 'start-discussion-other-user'];

const style = {
	textTransform: 'uppercase',
};

const useAction = (title, content) => useMutableCallback((e) => {
	e.preventDefault();
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

const useReactModal = (setModal, Component) => useMutableCallback((e) => {
	e.preventDefault();

	const handleClose = () => {
		setModal(null);
	};

	setModal(() => <Component
		onClose={handleClose}
	/>);
});

function CreateRoomList() {
	const t = useTranslation();
	const setModal = useSetModal();

	const canCreateChannel = useAtLeastOnePermission(CREATE_CHANNEL_PERMISSIONS);
	const canCreateDirectMessages = usePermission('create-d');
	const canCreateDiscussion = useAtLeastOnePermission(CREATE_DISCUSSION_PERMISSIONS);

	const createChannel = useReactModal(setModal, CreateChannel);
	const createDirectMessage = useAction(t('Direct_Messages'), 'CreateDirectMessage');
	const createDiscussion = useAction(t('Discussion_title'), 'CreateDiscussion');

	const discussionEnabled = useSetting('Discussion_enabled');

	return <div className='rc-popover__column'>
		<Margins block='x8'>
			<Box is='p' style={style} fontScale='micro'>{t('Create_new')}</Box>
		</Margins>
		<ul className='rc-popover__list'>
			<Margins block='x8'>
				{canCreateChannel && <CreateRoomListItem icon='hashtag' text={t('Channel')} action={createChannel} />}
				{canCreateDirectMessages && <CreateRoomListItem icon='balloon' text={t('Direct_Messages')} action={createDirectMessage} />}
				{discussionEnabled && canCreateDiscussion && <CreateRoomListItem icon='discussion' text={t('Discussion')} action={createDiscussion} />}
			</Margins>
		</ul>
	</div>;
}

export default CreateRoomList;
