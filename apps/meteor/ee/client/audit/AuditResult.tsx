import { Box } from '@rocket.chat/fuselage';
import { useStableArray } from '@rocket.chat/fuselage-hooks';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import type { Dispatch, MutableRefObject, ReactElement, SetStateAction } from 'react';
import React, { useEffect, useState, useRef, memo } from 'react';

import '../../app/auditing/client/templates/audit/audit.html';

type AuditResultProps = {
	setDataRef: MutableRefObject<Dispatch<SetStateAction<Record<string, any>>>>;
};

const AuditResult = ({ setDataRef }: AuditResultProps): ReactElement => {
	const ref = useRef<HTMLElement>(null);

	const [data, setData] = useState<Record<string, any>>({});

	const { msg, type, startDate, endDate, visitor, agent, users = [], rid } = data;

	const stableUsers = useStableArray(users);

	setDataRef.current = setData;

	useEffect(() => {
		if (!ref.current) {
			return;
		}

		const view = Blaze.renderWithData(
			Template.audit,
			{
				msg,
				type,
				startDate,
				endDate,
				visitor,
				agent,
				users: stableUsers,
				rid,
			},
			ref.current,
		);

		return () => Blaze.remove(view);
	}, [agent, endDate, msg, rid, startDate, type, stableUsers, visitor]);

	return <Box ref={ref} />;
};

export default memo(AuditResult);
