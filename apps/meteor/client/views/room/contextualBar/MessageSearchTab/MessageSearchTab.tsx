import { Callout } from '@rocket.chat/fuselage';
import {
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarIcon,
	ContextualbarSection,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import { useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MessageSearch from './components/MessageSearch';
import MessageSearchForm from './components/MessageSearchForm';
import { useMessageSearchProviderQuery } from './hooks/useMessageSearchProviderQuery';

const MessageSearchTab = () => {
	const providerQuery = useMessageSearchProviderQuery();

	const { closeTab } = useRoomToolbox();

	const [{ searchText, globalSearch }, handleSearch] = useState({ searchText: '', globalSearch: false });

	const { t } = useTranslation();
	const searchListId = useId();

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='magnifier' />
				<ContextualbarTitle>{t('Search_Messages')}</ContextualbarTitle>
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>
			{providerQuery.data && (
				<ContextualbarSection>
					<MessageSearchForm searchListId={searchListId} provider={providerQuery.data} onSearch={handleSearch} />
				</ContextualbarSection>
			)}
			<ContextualbarContent flexShrink={1} flexGrow={1} paddingInline={0}>
				{providerQuery.isSuccess && <MessageSearch searchListId={searchListId} searchText={searchText} globalSearch={globalSearch} />}
				{providerQuery.isError && (
					<Callout m={24} type='danger'>
						{t('Search_current_provider_not_active')}
					</Callout>
				)}
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default MessageSearchTab;
