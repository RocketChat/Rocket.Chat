import { Provider as StoreProvider, Consumer as StoreConsumer } from '../../store';
import App from './App';

const AppConnector = () => <div id='app'>
	<StoreProvider>
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
	</StoreProvider>
</div>;
export default AppConnector;
