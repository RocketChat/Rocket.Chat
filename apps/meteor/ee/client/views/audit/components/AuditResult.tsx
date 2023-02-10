import type { IMessage } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import AuditMessageList from './AuditMessageList';

type AuditResultProps = {
	className?: string;
	messages: IMessage[];
};

const AuditResult = ({ className, messages }: AuditResultProps): ReactElement => {
	const t = useTranslation();

	if (messages.length === 0) {
		return (
			<Box padding={24} textAlign='center'>
				{t('Nothing_found')}
			</Box>
		);
	}

	return (
		<div className={className} role='list' aria-live='polite'>
			<AuditMessageList messages={messages} />
		</div>
	);
};

export default memo(AuditResult);
