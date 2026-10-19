import { memo } from 'react';

import { Option } from '../Option';

const Empty = memo(function Empty() {
	return <Option label='Empty' />;
});

export default Empty;
