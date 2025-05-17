import {
	Accordion,
	AccordionItem,
	Box,
	States,
	StatesAction,
	StatesActions,
	StatesIcon,
	StatesSubtitle,
	StatesTitle,
} from '@rocket.chat/fuselage';
import type { ErrorInfo, ReactElement } from 'react';

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

				<Box p='x16' display='flex' flexDirection='column' alignItems='center' justifyContent='center'>
					<StatesSubtitle>
						<div style={{ textAlign: 'center' }}>
							<strong>Error Message: </strong>
							{_props.error.message}
						</div>

						<div style={{ textAlign: 'center' }}>
							<strong>Error Name: </strong>
							{_props.error.name}
						</div>
					</StatesSubtitle>

					<Accordion>
						{_props.error.stack && (
							<AccordionItem title='Stack Trace'>
								<Box color='default' fontScale='p2' marginBlockEnd={16} textAlign='center'>
									{_props.error.stack}
								</Box>
							</AccordionItem>
						)}
						{_props.info?.componentStack && (
							<AccordionItem title='Component Stack'>
								<Box color='default' fontScale='p2' marginBlockEnd={16} textAlign='center'>
									{_props.info.componentStack}
								</Box>
							</AccordionItem>
						)}
					</Accordion>
				</Box>

				<StatesActions>
					<StatesAction
						onClick={() => {
							const result = indexedDB.deleteDatabase('MeteorDynamicImportCache');
							result.onsuccess = () => {
								window.location.reload();
							};
							result.onerror = () => {
								window.location.reload();
							};
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
