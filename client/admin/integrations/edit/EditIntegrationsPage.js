import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React, { useCallback } from 'react';

import Page from '../../../components/basic/Page';
import EditIncomingWebhookWithData from './EditIncomingWebhook';
import EditOutgoingWebhookWithData from './EditOutgoingWebhook';
import { Modal } from '../../../components/basic/Modal';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';

export const DeleteWarningModal = ({ onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Integration_Delete_Warning')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onDelete}>{t('Delete')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export const SuccessModal = ({ onClose, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='checkmark-circled' size={20}/>
			<Modal.Title>{t('Deleted')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Your_entry_has_been_deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default function NewIntegrationsPage({ ...props }) {
	const t = useTranslation();

	const router = useRoute('admin-integrations');

	const type = useRouteParameter('type');
	const integrationId = useRouteParameter('id');

	const handleClickReturn = useCallback(() => {
		router.push({ });
	}, [router]);

	const handleClickHistory = useCallback(() => {
		router.push({ context: 'history', type: 'outgoing', id: integrationId });
	}, [integrationId, router]);

	return <Page flexDirection='column' {...props}>
		<Page.Header title={type === 'incoming' ? t('Integration_Incoming_WebHook') : t('Integration_Outgoing_WebHook')} >
			<ButtonGroup>
				<Button onClick={handleClickReturn}>
					<Icon name='back' size='x16'/> {t('Back')}
				</Button>
				{type === 'outgoing' && <Button onClick={handleClickHistory}>{t('History')}</Button>}
			</ButtonGroup>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			{
				(type === 'outgoing' && <EditOutgoingWebhookWithData integrationId={integrationId} key='outgoing'/>)
				|| (type === 'incoming' && <EditIncomingWebhookWithData integrationId={integrationId} key='incoming'/>)
			}
		</Page.ScrollableContentWithShadow>
	</Page>;
}
