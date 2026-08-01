import { useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';

import ConferenceEmbeddedPage from './ConferenceEmbeddedPage';
import ConferencePage from './ConferencePage';
import ConferencePageError from './ConferencePageError';
import ConferenceViewport from './ConferenceViewport';
import AuthenticationCheck from '../root/MainLayout/AuthenticationCheck';

const ConferenceRoute = () => {
	const id = useRouteParameter('id');
	const callUrlParam = useSearchParameter('callUrl');

	// `?callUrl=` carries a provider-supplied external URL: hand the user off to the provider's own UI.
	if (callUrlParam) {
		return (
			<AuthenticationCheck guest>
				<ConferencePage />
			</AuthenticationCheck>
		);
	}

	// A conference id opens the in-app conference: the call beside its persistent chat. Guests can't be
	// members of the conference's room, so authentication is required here.
	if (id) {
		return (
			<AuthenticationCheck guest={false}>
				<ConferenceViewport>
					<ConferenceEmbeddedPage callId={id} />
				</ConferenceViewport>
			</AuthenticationCheck>
		);
	}

	return (
		<ConferenceViewport>
			<ConferencePageError />
		</ConferenceViewport>
	);
};

export default ConferenceRoute;
