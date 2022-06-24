import { Accordion, Box } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import React, { useCallback, useEffect, useState } from 'react';

import ReleaseItem from './ReleaseItem';

const useReleases = (id: string): void => {
	const [, setData] = useSafely(useState({}));
	const getAppData = useEndpoint('GET', `/apps/${id}`);

	const fetchData = useCallback(async () => {
		try {
			const { app } = await getAppData({} as never);
			console.log('App releases:', app);
			setData(app);
		} catch (error) {
			setData(error);
		}
	}, [getAppData, setData]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// const total = data ? data.length : 0;
	// const releases = data.logs ? { ...data, logs: data.logs } : data;
};

const AppReleases = ({ id }: { id: string }): JSX.Element => {
	useReleases(id);

	const title = (
		<Box display='flex' flexDirection='row'>
			<Box is='h4' fontWeight='700' fontSize='x16' lineHeight='x24' color='default' mie='x24'>
				3.18.0
			</Box>
			<Box is='p' fontWeight='400' fontSize='x16' lineHeight='x24' color='info'>
				2 days ago
			</Box>
		</Box>
	);

	return (
		<>
			<Accordion width='100%' alignSelf='center'>
				<ReleaseItem title={title} />
			</Accordion>
		</>
	);
};

export default AppReleases;
