import React, { FC, memo } from 'react';

import VerticalBarAction from './VerticalBarAction';

const VerticalBarActionBack: FC = (props) => <VerticalBarAction {...props} name='arrow-back' />;

export default memo(VerticalBarActionBack);
