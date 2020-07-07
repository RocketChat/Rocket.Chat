import React, { useState } from 'react';
import { Button, ButtonGroup } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { Modal } from '../../components/basic/Modal';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useUserId } from '../../contexts/UserContext';
import Page from '../../components/basic/Page';
import AccountTokensTable from './AccountTokensTable';
import AddToken from './AddToken';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';

export const InfoModal = ({ title, content, icon, onConfirm, onClose, confirmText, cancelText, ...props }) => <Modal {...props}>
	<Modal.Header>
		{icon}
		<Modal.Title>{title}</Modal.Title>
		<Modal.Close onClick={onClose}/>
	</Modal.Header>
	<Modal.Content fontScale='p1'>
		{content}
	</Modal.Content>
	<Modal.Footer>
		<ButtonGroup align='end'>
			{cancelText && <Button onClick={onClose}>{cancelText}</Button>}
			{confirmText && onConfirm && <Button primary onClick={onConfirm}>{confirmText}</Button>}
		</ButtonGroup>
	</Modal.Footer>
</Modal>;

const emptyObj = {};

const AccountTokensPage = () => {
	const t = useTranslation();
	const userId = useUserId();

	const [modal, setModal] = useState(null);

	const canCreateTokens = usePermission('create-personal-access-tokens');

	const { data, reload } = useEndpointDataExperimental('users.getPersonalAccessTokens', emptyObj, []);

	if (!canCreateTokens) {
		return <NotAuthorizedPage />;
	}

	return <>
		<Page>
			<Page.Header title={t('Personal_Access_Tokens')}/>
			<Page.Content>
				<AddToken userId={userId} setModal={setModal} reload={reload}/>
				<AccountTokensTable userId={userId} setModal={setModal} data={data} reload={reload} />
			</Page.Content>
		</Page>
		{modal}
	</>;
};

export default AccountTokensPage;
