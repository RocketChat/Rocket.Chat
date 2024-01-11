import type { IWebdavAccountIntegration } from '@rocket.chat/core-typings';
import { useTranslation, useSetting, useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';

import { WebdavAccounts } from '../../../../../../../app/models/client';
import type { GenericMenuItemProps } from '../../../../../../components/GenericMenu/GenericMenuItem';
import { useReactiveValue } from '../../../../../../hooks/useReactiveValue';
import { useChat } from '../../../../contexts/ChatContext';
import AddWebdavAccountModal from '../../../../webdav/AddWebdavAccountModal';
import WebdavFilePickerModal from '../../../../webdav/WebdavFilePickerModal';

const getWebdavAccounts = (): IWebdavAccountIntegration[] => WebdavAccounts.find().fetch();

export const useWebdavActions = (): GenericMenuItemProps[] => {
	const t = useTranslation();
	const setModal = useSetModal();
	const webDavEnabled = useSetting('Webdav_Integration_Enabled');
	const webDavAccounts = useReactiveValue(getWebdavAccounts);
	const chat = useChat();

	const handleAddWebDav = () => setModal(<AddWebdavAccountModal onClose={() => setModal(null)} onConfirm={() => setModal(null)} />);

	const handleUpload = async (file: File, description?: string) =>
		chat?.uploads.send(file, {
			description,
		});

	const handleOpenWebdav = (account: IWebdavAccountIntegration) =>
		setModal(<WebdavFilePickerModal account={account} onUpload={handleUpload} onClose={() => setModal(null)} />);

	return [
		{
			id: 'webdav-add',
			content: t('Add_Server'),
			icon: 'cloud-plus',
			disabled: !webDavEnabled,
			onClick: handleAddWebDav,
		},
		...(webDavEnabled && webDavAccounts.length > 0
			? webDavAccounts.map((account) => ({
					id: account._id,
					content: account.name,
					icon: 'cloud-plus' as const,
					onClick: () => handleOpenWebdav(account),
			  }))
			: []),
	];
};
