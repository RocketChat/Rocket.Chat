import React from 'react';

import Page from '../../components/basic/Page';
import VerticalBar from '../../components/basic/VerticalBar';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRouteParameter, useRoute } from '../../contexts/RouterContext';

export function RoomsPage() {
	const t = useTranslation();

	const router = useRoute('admin-oauth-apps');

	const [sort, setSort] = useState();

	const onHeaderClick = (id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	};

	const onClick = (_id) => () => {
		router.push({
			id: _id,
		});
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Rooms')} />
			<Page.Content>
				<RoomsTable onHeaderClic={onHeaderClick}/>
			</Page.Content>
		</Page>
	</Page>;
}

export default RoomsPage;
