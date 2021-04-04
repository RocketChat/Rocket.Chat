import React, { FC, memo, ReactElement } from 'react';
import { Box, Icon } from '@rocket.chat/fuselage';

import { IMessage } from '../../../../definition/IMessage';
import Edited from './Edited';
import Translated from './Translated';

type StatusIconType = FC<{
	type: string;
	msg: IMessage;
}>;

const renderStatus = (type: string, msg: IMessage): ReactElement | undefined => {
	switch (type) {
		case 'edited':
			return <Edited msg={msg} />;
		case 'e2e':
			return <Icon name='key' />;
		case 'otr-ack':
			return <Icon name='otr-message' />;
		case 'translated':
			return <Translated msg={msg} />;
	}
};

const StatusIcon: StatusIconType = ({ type, msg }) => <Box is='span' mis='x3'>{renderStatus(type, msg)}</Box>;

export default memo(StatusIcon);
