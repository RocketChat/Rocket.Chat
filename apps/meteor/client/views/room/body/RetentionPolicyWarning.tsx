import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Bubble } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { withErrorBoundary } from '../../../components/withErrorBoundary';
import { usePruneWarningMessage } from '../../../hooks/usePruneWarningMessage';

const RetentionPolicyWarning = ({ room }: { room: IRoom }): ReactElement => {
	const { t } = useTranslation();

	const message = usePruneWarningMessage(room);

	return (
		<Box display='flex' justifyContent='center' pi={20} mb={8}>
			<Bubble role='alert' aria-live='polite' aria-label={t('Retention_policy_warning_banner')} small secondary>
				{message}
			</Bubble>
		</Box>
	);
};

export default withErrorBoundary(RetentionPolicyWarning);
