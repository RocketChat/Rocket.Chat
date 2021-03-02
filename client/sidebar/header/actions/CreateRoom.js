import React, { useMemo } from 'react';
import { Sidebar, Menu, Box, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { modal } from '../../../../app/ui-utils';
import { useAtLeastOnePermission, usePermission } from '../../../contexts/AuthorizationContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useSetModal } from '../../../contexts/ModalContext';
import CreateChannel from '../CreateChannel';

const CREATE_ROOM_PERMISSIONS = ['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user'];

const CREATE_CHANNEL_PERMISSIONS = ['create-c', 'create-p'];

const CREATE_DISCUSSION_PERMISSIONS = ['start-discussion', 'start-discussion-other-user'];

const useReactModal = (setModal, Component) => useMutableCallback(() => {
	const handleClose = () => {
		setModal(null);
	};

	setModal(() => <Component
		onClose={handleClose}
	/>);
});

const useAction = (title, content) => useMutableCallback(() => {
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

const CreateRoom = (props) => {
	const t = useTranslation();
	const setModal = useSetModal();

	const showCreate = useAtLeastOnePermission(CREATE_ROOM_PERMISSIONS);

	const canCreateChannel = useAtLeastOnePermission(CREATE_CHANNEL_PERMISSIONS);
	const canCreateDirectMessages = usePermission('create-d');
	const canCreateDiscussion = useAtLeastOnePermission(CREATE_DISCUSSION_PERMISSIONS);

	const createChannel = useReactModal(setModal, CreateChannel);
	const createDirectMessage = useAction(t('Direct_Messages'), 'CreateDirectMessage');
	const createDiscussion = useAction(t('Discussion_title'), 'CreateDiscussion');

	const discussionEnabled = useSetting('Discussion_enabled');

	const items = useMemo(() => [
		canCreateChannel && {
			label: <Box><Icon name={'hashtag'} />{t('Channel')}</Box>,
			action: createChannel,
		},
		canCreateDirectMessages && {
			label: <Box><Icon name={'baloon-arrow-left'} />{t('Direct_Messages')}</Box>,
			action: createDirectMessage,
		},
		discussionEnabled && canCreateDiscussion && {
			label: <Box><Icon name={'discussion'} />{t('Discussion')}</Box>,
			action: createDiscussion,
		},
	].filter(Boolean), [canCreateChannel, canCreateDirectMessages, canCreateDiscussion, createChannel, createDirectMessage, createDiscussion, discussionEnabled, t]);

	const menu = useMemo(() => <Menu
		key='menu'
		square
		mi='x4'
		icon='edit-rounded'
		options={items}
		{...props}
	/>, [items, props]);

	return showCreate ? <Sidebar.TopBar.Action children={menu}></Sidebar.TopBar.Action> : null;
};

export default CreateRoom;
