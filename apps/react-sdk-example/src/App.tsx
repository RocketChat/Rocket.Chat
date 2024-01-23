import { useLocalStorage } from '@rocket.chat/fuselage-hooks';

import Providers from './providers';
import App from './components/App';
import { Accordion, Box, TextInput } from '@rocket.chat/fuselage';
import { ChangeEvent } from 'react';
import Page from './components/Page';

/*
    If you want to test this example, you can import the component below at
    apps/meteor/client/views/root/MainLayout/MainLayout.tsx
    and place it inside the <Preload> component.
 */

export default function Example() {
	const [serverURL, setServerUrl] = useLocalStorage('sdk_server_url', 'https://unstable.rocket.chat');
	return (
		<Providers serverURL={serverURL}>
			<Page flexDirection='column'>
				<Accordion title='config and de'>
					<Accordion.Item defaultExpanded={false} title={'Server Url'}>
						<Box width='full' display='flex' flexDirection='row' alignItems='center'>
							<TextInput
								value={serverURL}
								onChange={({ currentTarget }: ChangeEvent<HTMLInputElement>) => setServerUrl(currentTarget.value)}
							/>
						</Box>
					</Accordion.Item>
				</Accordion>

				<App />
			</Page>
		</Providers>
	);
}
