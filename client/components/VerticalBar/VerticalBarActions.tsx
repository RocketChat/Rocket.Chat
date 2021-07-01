import { ButtonGroup } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

const VerticalBarActions: FC<{ children: React.ReactNode }> = (props) => (
	<ButtonGroup medium {...props} />
);

export default memo(VerticalBarActions);
