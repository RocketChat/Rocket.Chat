import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useState } from 'react';

import {
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarIcon,
} from '../../../../components/Contextualbar';
import { useTabBarClose } from '../../contexts/ToolboxContext';
import MessageSearch from './components/MessageSearch';
import MessageSearchForm from './components/MessageSearchForm';
import { useMessageSearchProviderQuery } from './hooks/useMessageSearchProviderQuery';

const MessageSearchTab = () => {
	const providerQuery = useMessageSearchProviderQuery();

	const tabBarClose = useTabBarClose();
	const handleCloseButtonClick = useCallback(() => {
		tabBarClose();
	}, [tabBarClose]);

	const [{ searchText, globalSearch }, handleSearch] = useState({ searchText: '', globalSearch: false });

	const t = useTranslation();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='magnifier' />
				<ContextualbarTitle>{t('Search_Messages')}</ContextualbarTitle>
				<ContextualbarClose onClick={handleCloseButtonClick} />
			</ContextualbarHeader>
			<ContextualbarContent flexShrink={1} flexGrow={1} paddingInline={0}>
				{providerQuery.isSuccess && (
					<>
						<MessageSearchForm provider={providerQuery.data} onSearch={handleSearch} />
						<MessageSearch searchText={searchText} globalSearch={globalSearch} />
					</>
				)}
				{providerQuery.isError && (
					<Callout m={24} type='danger'>
						{t('Search_current_provider_not_active')}
					</Callout>
				)}
			</ContextualbarContent>
		</>
	);
};

export default MessageSearchTab;
