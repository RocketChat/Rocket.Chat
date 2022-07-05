import { Button, Icon } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useRef, ReactElement } from 'react';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AddCustomEmoji from './AddCustomEmoji';
import CustomEmoji from './CustomEmoji';
import EditCustomEmojiWithData from './EditCustomEmojiWithData';

const CustomEmojiRoute = (): ReactElement => {
	const t = useTranslation();
	const route = useRoute('emoji-custom');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const canManageEmoji = usePermission('manage-emoji');

	const handleItemClick = (_id: string) => (): void => {
		route.push({
			context: 'edit',
			id: _id,
		});
	};

	const handleAddEmoji = useCallback(() => {
		route.push({ context: 'new' });
	}, [route]);

	const handleClose = (): void => {
		route.push({});
	};

	const reload = useRef(() => null);

	const handleChange = useCallback(() => {
		reload.current();
	}, [reload]);

	if (!canManageEmoji) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page flexDirection='row'>
			<Page name='admin-emoji-custom'>
				<Page.Header title={t('Custom_Emoji')}>
					<Button primary onClick={handleAddEmoji} aria-label={t('New')}>
						<Icon name='plus' /> {t('New')}
					</Button>
				</Page.Header>
				<Page.Content>
					<CustomEmoji reload={reload} onClick={handleItemClick} />
				</Page.Content>
			</Page>
			{context && (
				<VerticalBar flexShrink={0}>
					<VerticalBar.Header>
						{context === 'edit' && t('Custom_Emoji_Info')}
						{context === 'new' && t('Custom_Emoji_Add')}
						<VerticalBar.Close onClick={handleClose} />
					</VerticalBar.Header>
					{context === 'edit' && id && <EditCustomEmojiWithData _id={id} close={handleClose} onChange={handleChange} />}
					{context === 'new' && <AddCustomEmoji close={handleClose} onChange={handleChange} />}
				</VerticalBar>
			)}
		</Page>
	);
};

export default CustomEmojiRoute;
