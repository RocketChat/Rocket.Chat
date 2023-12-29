import { useLocalStorage } from '@rocket.chat/fuselage-hooks';

import Providers from './providers';
import App from './components/App';

/*
    If you want to test this example, you can import the component below at
    apps/meteor/client/views/root/MainLayout/MainLayout.tsx
    and place it inside the <Preload> component.
 */

export default function Example() {
	const [serverURL] = useLocalStorage('sdk_server_url', 'http://localhost:3000');
	return (
		<Providers serverURL={serverURL}>
			{serverURL}
			<App />
		</Providers>
	);
}
