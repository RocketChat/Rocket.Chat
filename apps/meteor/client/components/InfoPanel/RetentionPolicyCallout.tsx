import type { IRoom } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import React from 'react';

import { usePruneWarningMessage } from '../../hooks/usePruneWarningMessage';

const RetentionPolicyCallout = ({ room }: { room: IRoom }) => {
	const message = usePruneWarningMessage(room);

	return (
		<Callout arial-label={message} role='alert' aria-live='polite' type='warning'>
			<div>
				<p>{message}</p>
			</div>
		</Callout>
	);
};

export default RetentionPolicyCallout;
