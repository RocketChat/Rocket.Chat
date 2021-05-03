import { Box, Icon } from '@rocket.chat/fuselage';
import React, { FC, memo, ReactElement } from 'react';

import { IMessage } from '../../../../definition/IMessage';
import Edited from './Edited';
import Pinned from './Pinned';
import SentByMail from './SentByMail';
import Starred from './Starred';
import Translated from './Translated';

type TypeList =
	| 'edited'
	| 'e2e'
	| 'otr-ack'
	| 'translated'
	| 'pinned'
	| 'starred'
	| 'sent-by-email';

type StatusIconType = FC<{
	type: TypeList;
	msg: IMessage;
}>;

const renderStatus = (type: TypeList, msg: IMessage): ReactElement | undefined => {
	const iconSize = '16px';

	switch (type) {
		case 'edited':
			return <Edited size={iconSize} msg={msg} />;
		case 'e2e':
			return <Icon size={iconSize} name='key' />;
		case 'otr-ack':
			return <Icon size={iconSize} name='shredder' />;
		case 'translated':
			return <Translated size={iconSize} msg={msg} />;
		case 'pinned':
			return <Pinned size={iconSize} />;
		case 'starred':
			return <Starred size={iconSize} />;
		case 'sent-by-email':
			return <SentByMail size={iconSize} />;
	}
};

const StatusIcon: StatusIconType = ({ type, msg }) => (
	<Box is='span' mis='x4'>
		{renderStatus(type, msg)}
	</Box>
);

export default memo(StatusIcon);
