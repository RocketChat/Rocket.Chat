import type { IThreadMainMessage } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import { ContextualbarTitle } from '../../../../../components/Contextualbar';
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
