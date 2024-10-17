import { Icon, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

const OmnichannelRoomHeaderTag = () => {
	const t = useTranslation();

	// if (false) {
	// 	return null;
	// }

	return <Tag icon={<Icon size='x12' mie={4} name='warning' />}>Unknown</Tag>;
};

export default OmnichannelRoomHeaderTag;
