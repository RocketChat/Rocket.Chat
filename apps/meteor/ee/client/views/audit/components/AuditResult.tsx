import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import type { ReactElement } from 'react';
import React, { useCallback, useEffect, useRef, memo } from 'react';

import { createMessageContext } from '../../../../../app/ui-utils/client/lib/messageContext';
import { useReactiveValue } from '../../../../../client/hooks/useReactiveValue';
import type { IAuditLog } from '../../../../definition/IAuditLog';

type AuditResultProps = {
	className?: string;
	type: IAuditLog['fields']['type'];
	rid: IRoom['_id'];

	messages: IMessage[];
};

const AuditResult = ({ className, type, rid, messages }: AuditResultProps): ReactElement => {
	const ref = useRef<HTMLUListElement>(null);

	const messageContext = useReactiveValue(useCallback(() => createMessageContext({ rid }), [rid]));

	useEffect(() => {
		let view: Blaze.View | undefined;

		import('../../../templates/audit/audit.html').then(() => {
			if (!ref.current || messages.length === 0) {
				return;
			}

			view = Blaze.renderWithData(
				Template.audit,
				() => ({
					...messageContext,
					messages,
				}),
				ref.current,
			);
		});

		return () => {
			if (view) Blaze.remove(view);
		};
	}, [messageContext, messages, messages.length, type]);

	const t = useTranslation();

	if (messages.length === 0) {
		return (
			<Box padding={24} textAlign='center'>
				{t('Nothing_found')}
			</Box>
		);
	}

	return <ul ref={ref} className={['messages-list', className].filter(Boolean).join(' ')} aria-live='polite' />;
};

export default memo(AuditResult);
