import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import DeleteWarningModal from '../../../../components/DeleteWarningModal';

const DialogPruneMessages = ({ children, ...props }) => (
	<DeleteWarningModal {...props}>
		<Box textAlign='center' fontScale='s1'>
			{children}
		</Box>
	</DeleteWarningModal>
);

export default DialogPruneMessages;
