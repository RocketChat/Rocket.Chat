import type { IRoom } from '@rocket.chat/core-typings';
import { Bubble, MessageDivider } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { withErrorBoundary } from '../../../components/withErrorBoundary';
import { usePruneWarningMessage } from '../../../hooks/usePruneWarningMessage';

const RetentionPolicyWarning = ({ room }: { room: IRoom }): ReactElement => {
	const t = useTranslation();

	const message = usePruneWarningMessage(room);

	return (
		<MessageDivider>
			<Bubble role='alert' aria-live='polite' aria-label={t('Retention_policy_warning_banner')} small secondary>
				{message}
			</Bubble>
		</MessageDivider>
	);
};

export default withErrorBoundary(RetentionPolicyWarning);
