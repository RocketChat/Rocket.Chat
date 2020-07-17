import React, { useMemo, useState, useCallback } from 'react';
import { Button, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { usePermission } from '../../contexts/AuthorizationContext';
import { useTranslation } from '../../contexts/TranslationContext';
import Page from '../../components/basic/Page';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import { CustomEmoji } from './CustomEmoji';
import { EditCustomEmojiWithData } from './EditCustomEmoji';
import { AddCustomEmoji } from './AddCustomEmoji';
import { useRoute, useRouteParameter } from '../../contexts/RouterContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import VerticalBar from '../../components/basic/VerticalBar';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

export const useQuery = ({ text, itemsPerPage, current }, [column, direction], cache) => useMemo(() => ({
	query: JSON.stringify({ name: { $regex: text || '', $options: 'i' } }),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
// TODO: remove cache. Is necessary for data invalidation
}), [text, itemsPerPage, current, column, direction, cache]);

export default function CustomEmojiRoute({ props }) {
	const t = useTranslation();
	const canManageEmoji = usePermission('manage-emoji');

	const routeName = 'emoji-custom';

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);
	const [cache, setCache] = useState();

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const data = useEndpointData('emoji-custom.all', query) || { emojis: { } };

	const router = useRoute(routeName);

	const mobile = useMediaQuery('(max-width: 420px)');
	const small = useMediaQuery('(max-width: 780px)');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const onClick = (_id) => () => {
		router.push({
			context: 'edit',
			id: _id,
		});
	};

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	};

	const handleHeaderButtonClick = useCallback((context) => () => {
		router.push({ context });
	}, [router]);

	const close = () => {
		router.push({});
	};

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	if (!canManageEmoji) {
		return <NotAuthorizedPage />;
	}

	return <Page {...props} flexDirection='row'>
		<Page name='admin-emoji-custom'>
			<Page.Header title={t('Custom_Emoji')}>
				<Button small onClick={handleHeaderButtonClick('new')} aria-label={t('New')}>
					<Icon name='plus'/>
				</Button>
			</Page.Header>
			<Page.Content>
				<CustomEmoji setParams={setParams} params={params} onHeaderClick={onHeaderClick} data={data} onClick={onClick} sort={sort}/>
			</Page.Content>
		</Page>
		{ context
			&& <VerticalBar mod-small={small} mod-mobile={mobile} style={{ width: '378px' }} qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
				<VerticalBar.Header>
					{ context === 'edit' && t('Custom_Emoji_Info') }
					{ context === 'new' && t('Custom_Emoji_Add') }
					<VerticalBar.Close onClick={close}/></VerticalBar.Header>
				<VerticalBar.Content>
					{context === 'edit' && <EditCustomEmojiWithData _id={id} close={close} onChange={onChange} cache={cache}/>}
					{context === 'new' && <AddCustomEmoji close={close} onChange={onChange}/>}
				</VerticalBar.Content>
			</VerticalBar>}
	</Page>;
}
