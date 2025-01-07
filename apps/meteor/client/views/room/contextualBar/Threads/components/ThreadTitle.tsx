import type { IThreadMainMessage } from '@rocket.chat/core-typings';
import React, { useMemo } from 'react';

import { ContextualbarTitle } from '../../../../../components/Contextualbar';
import { normalizeThreadTitle } from '../../../../../lib/normalizeThreadTitle';

type ThreadTitleProps = {
	mainMessage: IThreadMainMessage;
};

const ThreadTitle = ({ mainMessage }: ThreadTitleProps) => {
	const innerHTML = useMemo(() => ({ __html: normalizeThreadTitle(mainMessage) ?? '' }), [mainMessage]);
	return <ContextualbarTitle dangerouslySetInnerHTML={innerHTML} />;
};

export default ThreadTitle;
