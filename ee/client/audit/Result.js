import React, { useEffect, useState, useRef } from 'react';
import { Box } from '@rocket.chat/fuselage';
import { useStableArray } from '@rocket.chat/fuselage-hooks';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';


import '../../app/auditing/client/templates/audit/audit.html';

const Result = React.memo(({ setDataRef }) => {
	const ref = useRef();

	const [data, setData] = useState({});

	const {
		msg,
		type,
		startDate,
		endDate,
		visitor,
		agent,
		users = [],
		rid,
	} = data;

	const stableUsers = useStableArray(users);

	setDataRef.current = setData;

	useEffect(() => {
		const view = Blaze.renderWithData(Template.audit, {
			msg,
			type,
			startDate,
			endDate,
			visitor,
			agent,
			users: stableUsers,
			rid,
		}, ref.current);

		return () => Blaze.remove(view);
	}, [agent, endDate, msg, rid, startDate, type, stableUsers, visitor]);

	return <Box ref={ref}/>;
});

export default Result;
