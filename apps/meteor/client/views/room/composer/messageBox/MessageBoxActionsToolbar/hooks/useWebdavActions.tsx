import type { IWebdavAccountIntegration } from '@rocket.chat/core-typings';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useWebDAVAccountIntegrationsQuery } from '../../../../../../hooks/webdav/useWebDAVAccountIntegrationsQuery';
import { useChat } from '../../../../contexts/ChatContext';
import AddWebdavAccountModal from '../../../../webdav/AddWebdavAccountModal';
import WebdavFilePickerModal from '../../../../webdav/WebdavFilePickerModal';

export const useWebdavActions = (): GenericMenuItemProps[] => {
	const enabled = useSetting('Webdav_Integration_Enabled', false);

	const { isSuccess, data } = useWebDAVAccountIntegrationsQuery({ enabled });

	const chat = useChat();

	const { t } = useTranslation();
	const setModal = useSetModal();
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
			disabled: !isSuccess,
			onClick: handleAddWebDav,
		},
		...(isSuccess
			? data.map((account) => ({
					id: account._id,
					content: account.name,
					icon: 'cloud-plus' as const,
					onClick: () => handleOpenWebdav(account),
				}))
			: []),
	];
};
