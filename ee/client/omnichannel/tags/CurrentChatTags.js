import { MultiSelect } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';

const CurrentChatTags = ({ value, handler, ...props }) => {
	const { data } = useEndpointDataExperimental('livechat/tags.list');
	const options = useMemo(() => (data && data.tags ? data.tags.map(({ name }) => [name, name]) : []), [data]);

	return <MultiSelect options={options} value={value} onChange={handler} flexGrow={1} {...props}/>;
};

export default CurrentChatTags;
