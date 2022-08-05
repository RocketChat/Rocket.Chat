import { App } from '@rocket.chat/core-typings';
import { Box, Skeleton } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { AsyncState, AsyncStatePhase } from '../../../lib/asyncState';
import AppRow from './AppRow';

type AppsListMainProps = {
	apps: AsyncState<
		{
			items: App[];
		} & {
			shouldShowSearchText: boolean;
		} & {
			count: number;
			offset: number;
			total: number;
		}
	>;
	title: string;
	isMarketplace: boolean;
};

const AppsList = ({ apps, title, isMarketplace }: AppsListMainProps): ReactElement => {
	const loadingRows = Array.from({ length: 8 }, (_, i) => <Skeleton key={i} height='x56' mbe='x8' width='100%' variant='rect' />);

	return (
		<>
			<Box is='h3' fontSize='h3' fontWeight={700} lineHeight='x28' color='default' mbe='x20'>
				{title}
			</Box>
			<Box overflowY='auto' height='100%'>
				{apps.phase === AsyncStatePhase.LOADING
					? loadingRows
					: apps.phase === AsyncStatePhase.RESOLVED &&
					  apps.value.items.map((app) => <AppRow key={app.id} isMarketplace={isMarketplace} {...app} />)}
			</Box>
		</>
	);
};

export default AppsList;
