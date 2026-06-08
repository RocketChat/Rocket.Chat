import { memo } from 'react';

import MessageSearchTabView from './MessageSearchTabView';
import { useMessageSearchTabData } from './useMessageSearchTabData';

const MessageSearchTab = () => {
	const data = useMessageSearchTabData();
	return <MessageSearchTabView {...data} />;
};

export default memo(MessageSearchTab);
