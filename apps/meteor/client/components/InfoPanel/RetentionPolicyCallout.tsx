import type { IRoom } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { usePruneWarningMessage } from '../../hooks/usePruneWarningMessage';
import { withErrorBoundary } from '../withErrorBoundary';

const RetentionPolicyCallout = ({ room }: { room: IRoom }) => {
	const message = usePruneWarningMessage(room);
	const t = useTranslation();

	return (
		<Callout arial-label={t('Retention_policy_warning_callout')} role='alert' aria-live='polite' type='warning'>
			<div>
				<p>{message}</p>
			</div>
		</Callout>
	);
};

export default withErrorBoundary(RetentionPolicyCallout);
