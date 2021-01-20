import { MultiSelect } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { useEndpointData } from '../../../../client/hooks/useEndpointData';

const CurrentChatTags = ({ value, handler, ...props }) => {
	const { value: data } = useEndpointData('livechat/tags.list');
	const options = useMemo(() => (data && data.tags ? data.tags.map(({ name }) => [name, name]) : []), [data]);

	return <MultiSelect options={options} value={value} onChange={handler} flexGrow={1} {...props}/>;
};

export default CurrentChatTags;
