import { Box, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import type { ErrorInfo, ReactElement } from 'react';
import React from 'react';

type AppErrorPageProps = {
	error: Error;
	info?: ErrorInfo;
	clearError: () => void;
};

const AppErrorPage = (_props: AppErrorPageProps): ReactElement => {
	return (
		<Box display='flex' justifyContent='center' height='full' backgroundColor='surface'>
			<States>
				<StatesIcon name='error-circle' />
				<StatesTitle>Application Error</StatesTitle>
				<StatesSubtitle>The application GUI just crashed.</StatesSubtitle>

				<StatesActions>
					<StatesAction
						onClick={() => {
							indexedDB.deleteDatabase('MeteorDynamicImportCache');
							window.location.reload();
						}}
					>
						Reload Application
					</StatesAction>
				</StatesActions>
			</States>
		</Box>
	);
};

export default AppErrorPage;
