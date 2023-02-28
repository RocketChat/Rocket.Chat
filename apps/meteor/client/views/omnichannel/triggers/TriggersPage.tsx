import { Button, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useRouteParameter, usePermission, useTranslation, useMethod, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import TriggersForm from './TriggersForm';
import TriggersFormWithData from './TriggersFormWithData';
import TriggersTableContainer from './TriggersTableContainer';

const TriggersPage = () => {
	const t = useTranslation();

	const canViewTriggers = usePermission('view-livechat-triggers');

	const router = useRoute('omnichannel-triggers');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleAdd = useMutableCallback(() => {
		router.push({ context: 'new' });
	});

	const handleCloseVerticalBar = useMutableCallback(() => {
		router.push({});
	});

	const dispatchToastMessage = useToastMessageDispatch();
	const save = useMethod('livechat:saveTrigger');

	const queryClient = useQueryClient();

	const handleSave = useMutableCallback(async (values) => {
		try {
			const {
				actions: {
					params: { sender, msg, name },
				},
				...restValues
			} = values;
			await save({
				...(id && { _id: id }),
				...restValues,
				conditions: [values.conditions],
				actions: [
					{
						name: 'send-message',
						params: {
							sender,
							msg,
							...(sender === 'custom' && { name }),
						},
					},
				],
			});
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			id && queryClient.invalidateQueries(['/v1/livechat/triggers/:_id', id], { exact: true });
			queryClient.invalidateQueries(['/v1/livechat/triggers']);
			router.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	if (!canViewTriggers) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Livechat_Triggers')}>
					<Button onClick={handleAdd}>
						<Icon name='plus' /> {t('New')}
					</Button>
				</Page.Header>
				<Page.Content>
					<TriggersTableContainer />
				</Page.Content>
			</Page>
			{context && (
				<VerticalBar>
					<VerticalBar.Header>
						{context === 'edit' ? t('Edit_Trigger') : t('New_Trigger')}
						<VerticalBar.Close onClick={handleCloseVerticalBar} />
					</VerticalBar.Header>
					<VerticalBar.ScrollableContent>
						{context === 'edit' && <TriggersFormWithData onSave={handleSave} key={id} id={id || ''} />}
						{context === 'new' && <TriggersForm onSave={handleSave} />}
					</VerticalBar.ScrollableContent>
				</VerticalBar>
			)}
		</Page>
	);
};

export default TriggersPage;
