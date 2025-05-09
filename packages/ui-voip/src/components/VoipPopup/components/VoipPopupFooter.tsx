import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const VoipPopupFooter = ({ children }: { children: ReactNode }) => (
	<Box is='footer' data-testid='vc-popup-footer' p={12} mbs='auto' bg='surface-light' borderRadius='0 0 4px 4px'>
		{children}
	</Box>
);

export default VoipPopupFooter;
