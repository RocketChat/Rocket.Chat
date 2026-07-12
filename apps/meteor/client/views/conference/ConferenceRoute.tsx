import { useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';

import ConferencePage from './ConferencePage';
import ConferencePageError from './ConferencePageError';
import LiveKitConferenceEmbeddedPage from './LiveKitConferenceEmbeddedPage';
import AuthenticationCheck from '../root/MainLayout/AuthenticationCheck';

const ConferenceRoute = () => {
	const id = useRouteParameter('id');
	const callUrl = useSearchParameter('callUrl');

	if (id) {
		return (
			<AuthenticationCheck guest={false}>
				<LiveKitConferenceEmbeddedPage />
			</AuthenticationCheck>
		);
	}

	if (callUrl) {
		return (
			<AuthenticationCheck guest>
				<ConferencePage />
			</AuthenticationCheck>
		);
	}

	return <ConferencePageError />;
};

export default ConferenceRoute;
