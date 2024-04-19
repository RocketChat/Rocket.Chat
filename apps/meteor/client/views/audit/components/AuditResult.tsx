import type { IMessage } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import GenericNoResults from '../../../components/GenericNoResults';
import AuditMessageList from './AuditMessageList';

type AuditResultProps = {
	className?: string;
	messages: IMessage[];
};

const AuditResult = ({ className, messages }: AuditResultProps): ReactElement => {
	if (messages.length === 0) {
		return <GenericNoResults />;
	}

	return (
		<div className={className} role='list' aria-live='polite'>
			<AuditMessageList messages={messages} />
		</div>
	);
};

export default memo(AuditResult);
