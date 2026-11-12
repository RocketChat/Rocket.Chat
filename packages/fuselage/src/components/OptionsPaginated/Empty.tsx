import { memo } from 'react';

import { Option } from '../Option';

export const Empty = memo(function Empty() {
	return <Option label='Empty' />;
});
