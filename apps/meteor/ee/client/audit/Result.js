import { Box } from '@rocket.chat/fuselage';
import { useStableArray } from '@rocket.chat/fuselage-hooks';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import React, { useEffect, useState, useRef, memo } from 'react';

import '../../app/auditing/client/templates/audit/audit.html';

const Result = memo(({ setDataRef }) => {
	const ref = useRef();

	const [data, setData] = useState({});

	const { msg, type, startDate, endDate, visitor, agent, users = [], rid } = data;

	const stableUsers = useStableArray(users);

	setDataRef.current = setData;

	useEffect(() => {
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
});

Result.displayName = 'Result';

export default Result;
