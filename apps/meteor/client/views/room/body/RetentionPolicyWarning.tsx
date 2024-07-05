import type { IRoom } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { usePruneWarningMessage } from '../../../hooks/usePruneWarningMessage';

const RetentionPolicyWarning = ({ room }: { room: IRoom }): ReactElement => {
	const t = useTranslation();

	const message = usePruneWarningMessage(room);

	return (
		<div
			aria-label={t('Retention_policy_warning_banner')}
			role='alert'
			aria-live='polite'
			className='start__purge-warning error-background error-border error-color'
		>
			<Icon name='warning' size='x20' /> {message}
		</div>
	);
};

export default RetentionPolicyWarning;
