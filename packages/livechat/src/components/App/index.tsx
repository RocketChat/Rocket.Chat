import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { parse } from 'query-string';

import ConnectionStatusProvider from '../../providers/ConnectionStatusProvider';
import SDKProvider from '../../providers/SDKProvider';
import ServerProvider from '../../providers/ServerProvider';
import { Provider as StoreProvider, Consumer as StoreConsumer } from '../../store';
import App from './App';

const host =
	window.SERVER_URL ?? parse(window.location.search).serverUrl ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null);

export const useSsl = Boolean((Array.isArray(host) ? host[0] : host)?.match(/^https:/));

const AppConnector = () => (
	<div id='app'>
		<QueryClientProvider client={new QueryClient()}>
			<StoreProvider>
				<SDKProvider serverURL={host}>
					<ConnectionStatusProvider>
						<ServerProvider>
							<StoreConsumer>
								{({
									config,
									user,
									triggered,
									gdpr,
									sound,
									undocked,
									minimized = true,
									expanded = false,
									alerts,
									modal,
									dispatch,
									iframe,
								}) => (
									<App
										config={config}
										gdpr={gdpr}
										triggered={triggered}
										user={user}
										sound={sound}
										undocked={undocked}
										minimized={minimized}
										expanded={expanded}
										alerts={alerts}
										modal={modal}
										dispatch={dispatch}
										iframe={iframe}
									/>
								)}
							</StoreConsumer>
						</ServerProvider>
					</ConnectionStatusProvider>
				</SDKProvider>
			</StoreProvider>
		</QueryClientProvider>
	</div>
);
export default AppConnector;
