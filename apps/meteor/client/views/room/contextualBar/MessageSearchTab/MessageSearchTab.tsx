import { Callout, Box, Throbber } from '@rocket.chat/fuselage';
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
import { memo, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import MessageSearch from './components/MessageSearch';
import MessageSearchForm from './components/MessageSearchForm';
import { useMessageSearchProviderQuery } from './hooks/useMessageSearchProviderQuery';
import { useMessageSearchQuery } from './hooks/useMessageSearchQuery';
import ResultsLiveRegion from '../../../../components/ResultsLiveRegion';

// TODO: Refactor this component to isolate the data from the visual
const MessageSearchTab = () => {
	const { t } = useTranslation();
	const searchListId = useId();
	const { closeTab } = useRoomToolbox();

	const providerQuery = useMessageSearchProviderQuery();

	const [{ searchText, globalSearch }, handleSearch] = useState({ searchText: '', globalSearch: false });
	const { isSuccess, data, isPending } = useMessageSearchQuery({ searchText, globalSearch });
	const itemCount = data?.itemCount ?? 0;

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='magnifier' />
				<ContextualbarTitle>{t('Search_Messages')}</ContextualbarTitle>
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>
			{providerQuery.data && (
				<ContextualbarSection>
					<MessageSearchForm provider={providerQuery.data} onSearch={handleSearch} searchListId={searchListId} isSuccess={isSuccess} />
				</ContextualbarSection>
			)}
			<ContextualbarContent flexShrink={1} flexGrow={1} paddingInline={0}>
				<ResultsLiveRegion shouldAnnounce={isSuccess} itemCount={itemCount} />
				{providerQuery.isSuccess && (
					<>
						{searchText && isPending && <Throbber />}
						{isSuccess && (
							<Box id={searchListId} w='full' h='full' overflow='hidden' flexShrink={1}>
								<MessageSearch searchText={searchText} globalSearch={globalSearch} />
							</Box>
						)}
					</>
				)}
				{providerQuery.isError && (
					<Callout m={24} type='danger'>
						{t('Search_current_provider_not_active')}
					</Callout>
				)}
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default memo(MessageSearchTab);
