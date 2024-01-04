import type { IWebdavAccountIntegration } from '@rocket.chat/core-typings';
import { Option, OptionIcon, OptionContent } from '@rocket.chat/fuselage';
import { useTranslation, useSetting, useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';

import { WebdavAccounts } from '../../../../../../../app/models/client';
import { useReactiveValue } from '../../../../../../hooks/useReactiveValue';
import type { ChatAPI } from '../../../../../../lib/chats/ChatAPI';
import { useChat } from '../../../../contexts/ChatContext';
import AddWebdavAccountModal from '../../../../webdav/AddWebdavAccountModal';
import WebdavFilePickerModal from '../../../../webdav/WebdavFilePickerModal';

const getWebdavAccounts = (): IWebdavAccountIntegration[] => WebdavAccounts.find().fetch();

const WebdavAction = ({ chatContext }: { chatContext?: ChatAPI }) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const webDavAccounts = useReactiveValue(getWebdavAccounts);

	const webDavEnabled = useSetting('Webdav_Integration_Enabled');

	const handleCreateWebDav = () => setModal(<AddWebdavAccountModal onClose={() => setModal(null)} onConfirm={() => setModal(null)} />);

	const chat = useChat() ?? chatContext;

	const handleUpload = async (file: File, description?: string) =>
		chat?.uploads.send(file, {
			description,
		});

	const handleOpenWebdav = (account: IWebdavAccountIntegration) =>
		setModal(<WebdavFilePickerModal account={account} onUpload={handleUpload} onClose={() => setModal(null)} />);

	return (
		<>
			<Option
				{...(!webDavEnabled && { title: t('WebDAV_Integration_Not_Allowed') })}
				disabled={!webDavEnabled}
				onClick={handleCreateWebDav}
			>
				<OptionIcon name='cloud-plus' />
				<OptionContent>{t('Add_Server')}</OptionContent>
			</Option>
			{webDavEnabled &&
				webDavAccounts.length > 0 &&
				webDavAccounts.map((account) => (
					<Option key={account._id} onClick={() => handleOpenWebdav(account)}>
						<OptionIcon name='cloud-plus' />
						<OptionContent>{account.name}</OptionContent>
					</Option>
				))}
		</>
	);
};

export default WebdavAction;
