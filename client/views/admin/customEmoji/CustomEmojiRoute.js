import React, { useMemo, useState, useCallback } from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import EditCustomEmojiWithData from './EditCustomEmojiWithData';
import AddCustomEmoji from './AddCustomEmoji';
import CustomEmoji from './CustomEmoji';

function CustomEmojiRoute() {
	const route = useRoute('emoji-custom');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const canManageEmoji = usePermission('manage-emoji');

	const t = useTranslation();

	const [params, setParams] = useState(() => ({ text: '', current: 0, itemsPerPage: 25 }));
	const [sort, setSort] = useState(() => ['name', 'asc']);

	const { text, itemsPerPage, current } = useDebouncedValue(params, 500);
	const [column, direction] = useDebouncedValue(sort, 500);
	const query = useMemo(() => ({
		query: JSON.stringify({ name: { $regex: text || '', $options: 'i' } }),
		sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
		...itemsPerPage && { count: itemsPerPage },
		...current && { offset: current },
	}), [text, itemsPerPage, current, column, direction]);

	const { value: data, reload } = useEndpointData('emoji-custom.all', query);

	const handleItemClick = (_id) => () => {
		route.push({
			context: 'edit',
			id: _id,
		});
	};

	const handleHeaderClick = (id) => {
		setSort(([sortBy, sortDirection]) => {
			if (sortBy === id) {
				return [id, sortDirection === 'asc' ? 'desc' : 'asc'];
			}

			return [id, 'asc'];
		});
	};

	const handleNewButtonClick = useCallback(() => {
		route.push({ context: 'new' });
	}, [route]);

	const handleClose = () => {
		route.push({});
	};

	const handleChange = useCallback(() => {
		reload();
	}, [reload]);

	if (!canManageEmoji) {
		return <NotAuthorizedPage />;
	}

	return <Page flexDirection='row'>
		<Page name='admin-emoji-custom'>
			<Page.Header title={t('Custom_Emoji')}>
				<Button small onClick={handleNewButtonClick} aria-label={t('New')}>
					<Icon name='plus'/>
				</Button>
			</Page.Header>
			<Page.Content>
				<CustomEmoji setParams={setParams} params={params} onHeaderClick={handleHeaderClick} data={data} onClick={handleItemClick} sort={sort}/>
			</Page.Content>
		</Page>
		{context && <VerticalBar flexShrink={0}>
			<VerticalBar.Header>
				{context === 'edit' && t('Custom_Emoji_Info')}
				{context === 'new' && t('Custom_Emoji_Add')}
				<VerticalBar.Close onClick={handleClose}/>
			</VerticalBar.Header>
			{context === 'edit' && <EditCustomEmojiWithData _id={id} close={handleClose} onChange={handleChange} />}
			{context === 'new' && <AddCustomEmoji close={handleClose} onChange={handleChange}/>}
		</VerticalBar>}
	</Page>;
}

export default CustomEmojiRoute;
