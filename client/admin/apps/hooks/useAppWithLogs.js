import { useEffect, useState } from 'react';

import { Apps } from '../../../../app/apps/client/orchestrator';

export const useAppWithLogs = ({ id, current, itemsPerPage, cache }) => {
	const [data, setData] = useState({});

	useEffect(() => {
		Promise.all([
			Apps.getApp(id),
			Apps.getAppLogs(id),
		]).then((results) => {
			setData({ ...results[0], logs: results[1] });
		}).catch((error) => {
			setData({ error });
		});
	}, [id, cache]);

	const sliceStart = data.logs && current > data.logs.length ? 0 : current;
	const total = data.logs ? data.logs.length : 0;
	const filteredData = data.logs
		? { ...data, logs: data.logs.slice(sliceStart, itemsPerPage + current) }
		: data;

	return [filteredData, total];
};
