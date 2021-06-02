import { Box, RadioButton } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

const SharingOptions: FC<{ radioHandlers: any }> = ({
	radioHandlers: { setPublic, setPrivate, setDepartment },
}) => (
	<Box>
		<RadioButton onChange={setPublic} />
		<RadioButton onChange={setDepartment} />
		<RadioButton onChange={setPrivate} />
	</Box>
);

export default memo(SharingOptions);
