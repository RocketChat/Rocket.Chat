import { Throbber, Box } from '@rocket.chat/fuselage';
import React, { ReactNode } from 'react';

import { useEndpointData } from '../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../lib/asyncState';
import OutOfOfficeForm from './AccountOutOfOfficeForm';

function OutOfOfficePage(): ReactNode {
	const { value, phase } = useEndpointData('outOfOffice.status' as any);

	if (phase === AsyncStatePhase.LOADING) {
		return (
			<Box maxWidth='x800' w='full' alignSelf='center'>
				<Throbber />
			</Box>
		);
	}
	return <OutOfOfficeForm receivedOutOfOfficeValues={value} />;
}

export default OutOfOfficePage;
