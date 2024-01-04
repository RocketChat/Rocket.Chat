import type { IRoom } from '@rocket.chat/core-typings';
import type { Icon } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation, useUserRoom } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEvent } from 'react';
import React from 'react';

import { messageBox } from '../../../../../../app/ui-utils/client';
import GenericMenu from '../../../../../components/GenericMenu/GenericMenu';
import type { GenericMenuItemProps } from '../../../../../components/GenericMenu/GenericMenuItem';
import { useMessageboxAppsActionButtons } from '../../../../../hooks/useAppActionButtons';
import { useChat } from '../../../contexts/ChatContext';
import { useCreateDiscussionAction } from './actions/useCreateDiscussionAction';
import { useShareLocationAction } from './actions/useShareLocationAction';
import { useWebdavAction } from './actions/useWebdavAction';

type ActionsToolbarDropdownProps = {
	isRecording?: boolean;
	rid: IRoom['_id'];
	tmid?: string;
	actions?: GenericMenuItemProps[];
};

const ActionsToolbarDropdown = ({ isRecording, rid, tmid, actions }: ActionsToolbarDropdownProps) => {
	const t = useTranslation();
	const chatContext = useChat();

	if (!chatContext) {
		throw new Error('useChat must be used within a ChatProvider');
	}

	const room = useUserRoom(rid);
	const apps = useMessageboxAppsActionButtons();

	const groups = {
		...(apps.isSuccess &&
			apps.data.length > 0 && {
				Apps: apps.data,
			}),
		...messageBox.actions.get(),
	};

	const messageBoxActions = Object.entries(groups).map(([name, group]) => {
		const items: GenericMenuItemProps[] = group.map((item) => ({
			id: item.id,
			icon: item.icon as ComponentProps<typeof Icon>['name'],
			content: t(item.label),
			onClick: (event?: MouseEvent<HTMLElement>) =>
				item.action({
					rid,
					tmid,
					event: event as unknown as Event,
					chat: chatContext,
				}),
			gap: Boolean(!item.icon),
		}));

		return {
			title: t(name as TranslationKey),
			items: items || [],
		};
	});

	const { handleCreateDiscussion, allowDiscussion } = useCreateDiscussionAction(room);
	const { handleAddWebdav, handleOpenWebdav, webDavAccounts, webDavEnabled } = useWebdavAction();
	const { handleShareLocation, allowGeolocation } = useShareLocationAction(room, tmid);

	const createDiscussionItem: GenericMenuItemProps = {
		id: 'discussion',
		content: t('Discussion'),
		icon: 'discussion',
		disabled: !allowDiscussion,
		onClick: () => handleCreateDiscussion(),
	};

	const createWebDavItem: GenericMenuItemProps = {
		id: 'create-webdav',
		content: t('Add_Server'),
		icon: 'cloud-plus',
		disabled: !webDavEnabled,
		onClick: () => handleAddWebdav(),
	};

	const webdavItems: GenericMenuItemProps[] =
		(webDavEnabled &&
			webDavAccounts.length > 0 &&
			webDavAccounts.map((account) => ({
				id: account._id,
				content: account.name,
				icon: 'cloud-plus',
				onClick: () => handleOpenWebdav(account),
			}))) ||
		[];

	const shareLocationItem: GenericMenuItemProps = {
		id: 'share-location',
		content: t('Location'),
		icon: 'map-pin',
		disabled: !allowGeolocation,
		onClick: () => handleShareLocation(),
	};

	const sections = [
		{ title: t('Create_new'), items: [createDiscussionItem, ...(actions || []), createWebDavItem, ...webdavItems] },
		{ title: t('Share'), items: [shareLocationItem] },
		...messageBoxActions,
	];

	return (
		<GenericMenu disabled={isRecording} data-qa-id='menu-more-actions' detached icon='plus' sections={sections} title={t('More_actions')} />
	);
};

export default ActionsToolbarDropdown;
