import type { ISearchProvider } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState, useCallback } from 'react';

import MessageSearch from './MessageSearch';
import MessageSearchFormWithSuggestions from './MessageSearchFormWithSuggestions';
import MessageSearchFormWithoutSuggestions from './MessageSearchFormWithoutSuggestions';

type MessageSearchPanelProps = {
	provider: ISearchProvider;
};

const MessageSearchPanel = ({ provider }: MessageSearchPanelProps): ReactElement => {
	const [searchText, setSearchText] = useState('');

	const handleSearch = useCallback((searchText: string) => {
		setSearchText(searchText);
	}, []);

	const t = useTranslation();

	return (
		<>
			{provider.description && (
				<div className='title'>
					<p dangerouslySetInnerHTML={{ __html: t(provider.description as TranslationKey) }} />
				</div>
			)}
			<Box className={['list-view', provider.key]} display='flex' flexGrow={0} flexShrink={1} flexDirection='column'>
				<Box className='control rocket-search-input'>
					{provider.supportsSuggestions ? (
						<MessageSearchFormWithSuggestions provider={provider} onSearch={handleSearch} />
					) : (
						<MessageSearchFormWithoutSuggestions provider={provider} onSearch={handleSearch} />
					)}
				</Box>
			</Box>
			{provider.resultTemplate === 'DefaultSearchResultTemplate' && (
				<MessageSearch settings={provider.settings as any} searchText={searchText} />
			)}
		</>
	);
};

export default MessageSearchPanel;
