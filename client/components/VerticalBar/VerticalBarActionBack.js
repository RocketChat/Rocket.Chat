import React, { memo } from 'react';

import VerticalBarAction from './VerticalBarAction';

const VerticalBarActionBack = (props) => (
	<VerticalBarAction {...props} name='arrow-back' />
);

export default memo(VerticalBarActionBack);
