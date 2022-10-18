import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';

const ToolboxDivider: FC<any> = () => (
	<Box is='hr' w='2x' display='block' backgroundColor='light' justifySelf='stretch' alignSelf='stretch' mi='x4' />
);

export default ToolboxDivider;
