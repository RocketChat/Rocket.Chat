import type { IThreadMainMessage } from '@rocket.chat/core-typings';
import { ContextualbarTitle } from '@rocket.chat/ui-client';
import { useMemo } from 'react';

import { useNormalizedThreadTitleHtml } from '../hooks/useNormalizedThreadTitleHtml';

type ThreadTitleProps = {
	mainMessage: IThreadMainMessage;
};

const ThreadTitle = ({ mainMessage }: ThreadTitleProps) => {
	const html = useNormalizedThreadTitleHtml(mainMessage);

	const innerHTML = useMemo(() => ({ __html: html }), [html]);
	return <ContextualbarTitle dangerouslySetInnerHTML={innerHTML} />;
};

export default ThreadTitle;
