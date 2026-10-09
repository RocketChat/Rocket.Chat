import {
	Box,
	Icon,
	PaletteStyleTag,
	States,
	StatesAction,
	StatesActions,
	StatesIcon,
	StatesSubtitle,
	StatesTitle,
} from '@rocket.chat/fuselage';
import { useThemeMode } from '@rocket.chat/ui-client';

import { Info } from '../../../app/utils/rocketchat.info';
import { useCopyErrorReport } from '../../components/ErrorReport/useCopyErrorReport';

export type AppErrorPageProps = {
	error: unknown;
	info?: { componentStack?: string | null };
};

// Rendered above the translation, router and server providers, hence the hardcoded English copy
const AppErrorPage = ({ error, info }: AppErrorPageProps) => {
	const theme = useThemeMode();
	const { copy, hasCopied } = useCopyErrorReport({
		error,
		componentStack: info?.componentStack,
		version: Info.version,
		commitHash: Info.commit?.hash,
	});

	return (
		<>
			<PaletteStyleTag theme={theme} tagId='app-error-palette' />
			<Box display='flex' justifyContent='center' height='full' backgroundColor='surface'>
				<States>
					<StatesIcon name='error-circle' />
					<StatesTitle>Application Error</StatesTitle>
					<StatesSubtitle>
						The application GUI just crashed. Copy the error details to include them when reporting this issue.
					</StatesSubtitle>

					<StatesActions>
						<StatesAction variant='primary' onClick={copy}>
							<Icon name={hasCopied ? 'check' : 'copy'} /> {hasCopied ? 'Copied' : 'Copy error details'}
						</StatesAction>
						<StatesAction
							onClick={() => {
								const result = indexedDB.deleteDatabase('MeteorDynamicImportCache');
								const reload = () => {
									window.location.reload();
								};
								result.onsuccess = reload;
								result.onerror = reload;
								result.onblocked = reload;
							}}
						>
							Reload Application
						</StatesAction>
					</StatesActions>
				</States>
			</Box>
		</>
	);
};

export default AppErrorPage;
