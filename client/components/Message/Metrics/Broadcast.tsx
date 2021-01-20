import React, { FC } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { Reply, Content } from '..';


type BroadcastOptions = {
	username: string;
	mid: string;
	replyBroadcast: () => void;
};

const BroadcastMetric: FC<BroadcastOptions> = ({ username, mid, replyBroadcast }) => {
	const t = useTranslation();
	return <Content>
		<Reply data-username={username} data-mid={mid} onClick={replyBroadcast}>{t('Reply')}</Reply>
	</Content>;
};

export default BroadcastMetric;
