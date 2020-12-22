import React from 'react';
import { Box, Throbber } from '@rocket.chat/fuselage';

export const LoadingStarredMessages = () => <Box h='full' w='full' display='flex' justifyContent='center' alignItems='center'>
	<Throbber />
</Box>;
