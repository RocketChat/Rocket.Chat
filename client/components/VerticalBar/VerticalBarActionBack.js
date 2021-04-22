import React, { memo } from 'react';

import VerticalBarAction from './VerticalBarAction';

function VerticalBarActionBack(props) {
	return <VerticalBarAction {...props} name='arrow-back' />;
}

export default memo(VerticalBarActionBack);
