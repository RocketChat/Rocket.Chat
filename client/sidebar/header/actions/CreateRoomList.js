import React from 'react';
import { Icon, Box, Flex, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';


import { modal } from '../../../../app/ui-utils';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useAtLeastOnePermission, usePermission } from '../../../contexts/AuthorizationContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useSetModal } from '../../../contexts/ModalContext';
import CreateChannel from '../CreateChannel';

const CREATE_CHANNEL_PERMISSIONS = ['create-c', 'create-p'];

const CREATE_DISCUSSION_PERMISSIONS = ['start-discussion', 'start-discussion-other-user'];

function CreateRoomListItem({ text, icon, action }) {
	return <Flex.Container>
		<Box is='li' onClick={action}>
			<Flex.Container>
				<Box is='label' className='rc-popover__label' style={{ width: '100%' }}>
					<Flex.Item grow={0}>
						<Box className='rc-popover__icon'><Icon name={icon} size={20}/></Box>
					</Flex.Item>
					<Margins inline='x8'>
						<Flex.Item grow={1}>
							<Box is='span' fontScale='p2'>{text}</Box>
						</Flex.Item>
					</Margins>
				</Box>
			</Flex.Container>
		</Box>
	</Flex.Container>;
}
const style = {
	textTransform: 'uppercase',
};
export function CreateRoomList() {
	return <>
		<div className='rc-popover__column'>
			<CreateRoomOptions/>
		</div>
	</>;
}

CreateRoomList.displayName = 'CreateRoomList';

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

function CreateRoomOptions() {
	const t = useTranslation();
	const setModal = useSetModal();

	const canCreateChannel = useAtLeastOnePermission(CREATE_CHANNEL_PERMISSIONS);
	const canCreateDirectMessages = usePermission('create-d');
	const canCreateDiscussion = useAtLeastOnePermission(CREATE_DISCUSSION_PERMISSIONS);

	const createChannel = useReactModal(setModal, CreateChannel);
	const createDirectMessage = useAction(t('Direct_Messages'), 'CreateDirectMessage');
	const createDiscussion = useAction(t('Discussion_title'), 'CreateDiscussion');

	const discussionEnabled = useSetting('Discussion_enabled');

	return <>
		<Margins block='x8'>
			<Box is='p' style={style} fontScale='micro'>{t('Create_new')}</Box>
		</Margins>
		<ul className='rc-popover__list'>
			<Margins block='x8'>
				{canCreateChannel && <CreateRoomListItem icon={'hashtag'} text={t('Channel')} action={createChannel} />}
				{canCreateDirectMessages && <CreateRoomListItem icon={'baloon-arrow-left'} text={t('Direct_Messages')} action={createDirectMessage} />}
				{discussionEnabled && canCreateDiscussion && <CreateRoomListItem icon={'discussion'} text={t('Discussion')} action={createDiscussion} />}
			</Margins>
		</ul>
	</>;
}

export default CreateRoomList;
