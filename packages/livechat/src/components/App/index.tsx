import { parse } from 'query-string';

import App from './App';
import SDKProvider from '../../providers/SDKProvider';
import ServerProvider from '../../providers/ServerProvider';
import { Provider as StoreProvider, Consumer as StoreConsumer } from '../../store';

export const host =
	window.SERVER_URL ?? parse(window.location.search).serverUrl ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null);

export const useSsl = Boolean((Array.isArray(host) ? host[0] : host)?.match(/^https:/));

const AppConnector = () => (
	<div id='app'>
		<StoreProvider>
			<SDKProvider serverURL={host}>
				<ServerProvider>
					<StoreConsumer>
						{({ config, user, triggered, gdpr, sound, undocked, minimized = true, expanded = false, alerts, modal, dispatch, iframe }) => (
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
			</SDKProvider>
		</StoreProvider>
	</div>
);
export default AppConnector;
