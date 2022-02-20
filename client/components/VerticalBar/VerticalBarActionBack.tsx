import React, { ReactElement, memo, ComponentProps } from 'react';

import VerticalBarAction from './VerticalBarAction';

const VerticalBarActionBack = (props: ComponentProps<typeof VerticalBarAction>): ReactElement => (
	<VerticalBarAction {...props} name='arrow-back' />
);

export default memo(VerticalBarActionBack);
