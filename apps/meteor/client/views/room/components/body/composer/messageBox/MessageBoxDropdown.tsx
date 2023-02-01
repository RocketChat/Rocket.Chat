import type { IRoom, IWebdavAccount } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Dropdown, IconButton, Option, OptionTitle, OptionIcon, OptionContent } from '@rocket.chat/fuselage';
import { useTranslation, useSetting, usePermission, useUserRoom, useSetModal } from '@rocket.chat/ui-contexts';
import React, { useRef } from 'react';

import { WebdavAccounts } from '../../../../../../../app/models/client';
import CreateDiscussion from '../../../../../../components/CreateDiscussion';
import type { ChatAPI } from '../../../../../../lib/chats/ChatAPI';
import { useDropdownVisibility } from '../../../../../../sidebar/header/hooks/useDropdownVisibility';
import ShareLocationModal from '../../../../ShareLocation/ShareLocationModal';
import { useChat } from '../../../../contexts/ChatContext';
import AddWebdavAccountModal from '../../../../webdav/AddWebdavAccountModal';
import WebdavFilePickerModal from '../../../../webdav/WebdavFilePickerModal';

type MessageBoxDropdownProps = {
	chatContext?: ChatAPI;
	rid: IRoom['_id'];
	tmid?: string;
};

const MessageBoxDropdown = ({ chatContext, rid, tmid }: MessageBoxDropdownProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const reference = useRef(null);
	const target = useRef(null);

	const room = useUserRoom(rid);
	const chat = useChat() ?? chatContext;

	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

	// Discussion
	const handleCreateDiscussion = () =>
		setModal(<CreateDiscussion onClose={() => setModal(null)} defaultParentRoom={room?.prid || room?._id} />);

	const discussionEnabled = useSetting('Discussion_enabled');
	const canStartDiscussion = usePermission('start-discussion');
	const canSstartDiscussionOtherUser = usePermission('start-discussion-other-user');

	const showDiscussion = room && discussionEnabled && !isRoomFederated(room) && (canStartDiscussion || canSstartDiscussionOtherUser);

	// WebDAV
	const webDavEnabled = useSetting('Webdav_Integration_Enabled');

	const handleCreateWebDav = () => setModal(<AddWebdavAccountModal onClose={() => setModal(null)} onConfirm={() => setModal(null)} />);

	const webDavAccounts = WebdavAccounts.find().fetch();

	const handleUpload = async (file: File, description?: string) =>
		chat?.uploads.send(file, {
			description,
		});

	const handleOpenWebdav = (account: IWebdavAccount) =>
		setModal(<WebdavFilePickerModal account={account} onUpload={handleUpload} onClose={() => setModal(null)} />);

	// Geolocation
	const isMapViewEnabled = useSetting('MapView_Enabled') === true;
	const isGeolocationCurrentPositionSupported = Boolean(navigator.geolocation?.getCurrentPosition);
	const googleMapsApiKey = useSetting('MapView_GMapsAPIKey') as string;
	const canGetGeolocation = isMapViewEnabled && isGeolocationCurrentPositionSupported && googleMapsApiKey && googleMapsApiKey.length;

	const showGeoLocation = room && canGetGeolocation && !isRoomFederated(room);

	const handleShareLocation = () => setModal(<ShareLocationModal rid={rid} tmid={tmid} onClose={() => setModal(null)} />);

	return (
		<>
			<IconButton small ref={reference} icon='plus' onClick={() => toggle()} />
			{isVisible && (
				<Dropdown reference={reference} ref={target} placement='bottom-start'>
					<OptionTitle>{t('Create_new')}</OptionTitle>
					{showDiscussion && (
						<Option onClick={handleCreateDiscussion}>
							<OptionIcon name='discussion' />
							<OptionContent>{t('Discussion')}</OptionContent>
						</Option>
					)}
					{webDavEnabled && (
						<>
							<Option onClick={handleCreateWebDav}>
								<OptionIcon name='cloud-plus' />
								<OptionContent>{t('Add_Server')}</OptionContent>
							</Option>
							{webDavAccounts.length > 0 &&
								webDavAccounts.map((account) => (
									<Option key={account._id} onClick={() => handleOpenWebdav(account)}>
										<OptionIcon name='cloud-plus' />
										<OptionContent>{account.name}</OptionContent>
									</Option>
								))}
						</>
					)}
					{showGeoLocation && (
						<>
							<OptionTitle>{t('Share')}</OptionTitle>
							<Option onClick={handleShareLocation}>
								<OptionIcon name='map-pin' />
								<OptionContent>{t('Location')}</OptionContent>
							</Option>
						</>
					)}
				</Dropdown>
			)}
		</>
	);
};

export default MessageBoxDropdown;
