import React, { useMemo } from 'react';
import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { popover, modal } from '../../../../app/ui-utils';
import { useAtLeastOnePermission, usePermission } from '../../../contexts/AuthorizationContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const CREATE_ROOM_PERMISSIONS = ['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user'];

const CREATE_CHANNEL_PERMISSIONS = ['create-c', 'create-p'];

const CREATE_DISCUSSION_PERMISSIONS = ['start-discussion', 'start-discussion-other-user'];

const openPopover = (e, items) => popover.open({
	columns: [
		{
			groups: [
				{
					items,
				},
			],
		},
	],
	currentTarget: e.currentTarget,
	offsetVertical: e.currentTarget.clientHeight + 10,
});

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

const CreateRoom = (props) => {
	const t = useTranslation();
	const showCreate = useAtLeastOnePermission(CREATE_ROOM_PERMISSIONS);

	const canCreateChannel = useAtLeastOnePermission(CREATE_CHANNEL_PERMISSIONS);
	const canCreateDirectMessages = usePermission('create-d');
	const canCreateDiscussion = useAtLeastOnePermission(CREATE_DISCUSSION_PERMISSIONS);

	const createChannel = useAction(t('Create_A_New_Channel'), 'createChannel');
	const createDirectMessage = useAction(t('Direct_Messages'), 'CreateDirectMessage');
	const createDiscussion = useAction(t('Discussion_title'), 'CreateDiscussion');

	const discussionEnabled = useSetting('Discussion_enabled');

	const items = useMemo(() => [
		canCreateChannel && {
			icon: 'hashtag',
			name: t('Channel'),
			qa: 'sidebar-create-channel',
			action: createChannel,
		},
		canCreateDirectMessages && {
			icon: 'team',
			name: t('Direct_Messages'),
			qa: 'sidebar-create-dm',
			action: createDirectMessage,
		},
		discussionEnabled && canCreateDiscussion && {
			icon: 'discussion',
			name: t('Discussion'),
			qa: 'sidebar-create-discussion',
			action: createDiscussion,
		},
	].filter(Boolean), [canCreateChannel, canCreateDirectMessages, canCreateDiscussion, createChannel, createDirectMessage, createDiscussion, discussionEnabled, t]);

	const onClick = useMutableCallback((e) => {
		if (items.length === 1) {
			return items[0].action(e);
		}
		openPopover(e, items);
	});

	return showCreate ? <Sidebar.TopBar.Action {...props} icon='edit-rounded' onClick={onClick}/> : null;
};

export default CreateRoom;
