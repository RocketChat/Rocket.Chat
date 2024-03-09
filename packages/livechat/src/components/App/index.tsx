import { parse } from 'query-string';

import ConnectionStatusProvider from '../../providers/ConnectionStatusProvider';
import SDKProvider from '../../providers/SDKProvider';
import ServerProvider from '../../providers/ServerProvider';
import { Provider as StoreProvider } from '../../store';
import App from './App';

export const host =
	window.SERVER_URL ?? parse(window.location.search).serverUrl ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null);

export const useSsl = Boolean((Array.isArray(host) ? host[0] : host)?.match(/^https:/));

const AppConnector = () => (
	<div id='app'>
		<StoreProvider>
			<SDKProvider serverURL={host}>
				<ConnectionStatusProvider>
					<ServerProvider>
						<App />
					</ServerProvider>
				</ConnectionStatusProvider>
			</SDKProvider>
		</StoreProvider>
	</div>
);
export default AppConnector;
