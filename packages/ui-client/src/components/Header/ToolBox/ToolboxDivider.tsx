import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';

const ToolboxDivider: FC<any> = () => (
	<Box is='hr' w='2px' display='block' backgroundColor='neutral-400' justifySelf='stretch' alignSelf='stretch' mi='x4' />
);

export default ToolboxDivider;
