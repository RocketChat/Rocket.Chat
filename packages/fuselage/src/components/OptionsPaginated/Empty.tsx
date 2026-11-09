import { memo } from 'react';

import { Option } from '../Option/index.js';

export const Empty = memo(function Empty() {
	return <Option label='Empty' />;
});
