import { Callout } from '@rocket.chat/fuselage';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import MessageSearch from './components/MessageSearch';
import MessageSearchForm from './components/MessageSearchForm';
import { useMessageSearchProviderQuery } from './hooks/useMessageSearchProviderQuery';
import {
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarIcon,
	ContextualbarSection,
} from '../../../../components/Contextualbar';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

const MessageSearchTab = () => {
	const providerQuery = useMessageSearchProviderQuery();

	const { closeTab } = useRoomToolbox();

	const [{ searchText, globalSearch }, handleSearch] = useState({ searchText: '', globalSearch: false });

	const { t } = useTranslation();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='magnifier' />
				<ContextualbarTitle>{t('Search_Messages')}</ContextualbarTitle>
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>
			{providerQuery.data && (
				<ContextualbarSection>
					<MessageSearchForm provider={providerQuery.data} onSearch={handleSearch} />
				</ContextualbarSection>
			)}
			<ContextualbarContent flexShrink={1} flexGrow={1} paddingInline={0}>
				{providerQuery.isSuccess && <MessageSearch searchText={searchText} globalSearch={globalSearch} />}
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
