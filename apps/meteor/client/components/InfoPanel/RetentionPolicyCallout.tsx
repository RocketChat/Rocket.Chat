import type { IRoom } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { usePruneWarningMessage } from '../../hooks/usePruneWarningMessage';
import { withErrorBoundary } from '../withErrorBoundary';

const RetentionPolicyCallout = ({ room }: { room: IRoom }) => {
	const message = usePruneWarningMessage(room);
	const { t } = useTranslation();

	return (
		<Callout arial-label={t('Retention_policy_warning_callout')} role='alert' aria-live='polite' type='warning'>
			<div>
				<p>{message}</p>
			</div>
		</Callout>
	);
};

export default withErrorBoundary(RetentionPolicyCallout);
