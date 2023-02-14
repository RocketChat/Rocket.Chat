import type { IMessageSearchProvider } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React, { useState } from 'react';

import MessageSearch from './MessageSearch';
import MessageSearchForm from './MessageSearchForm';

type MessageSearchPanelProps = {
	provider: IMessageSearchProvider;
};

const MessageSearchPanel = ({ provider }: MessageSearchPanelProps): ReactElement => {
	const [searchText, setSearchText] = useState('');

	return (
		<>
			<MessageSearchForm provider={provider} onSearch={setSearchText} />
			<MessageSearch searchText={searchText} />
		</>
	);
};

export default MessageSearchPanel;
