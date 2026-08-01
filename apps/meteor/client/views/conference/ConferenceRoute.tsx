import { useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';

import ConferenceEmbeddedPage from './ConferenceEmbeddedPage';
import ConferencePage from './ConferencePage';
import ConferencePageError from './ConferencePageError';
import ConferenceViewport from './ConferenceViewport';
import AuthenticationCheck from '../root/MainLayout/AuthenticationCheck';
import PageLoading from '../root/PageLoading';

// The conference renders standalone, so the auth chain's default app-shaped skeleton (sidebar, message
// list, composer) would flash chrome this page never shows. A plain spinner also matches what the
// conference itself shows while it loads, making the whole startup one continuous state.
const conferenceLoading = <PageLoading />;

const ConferenceRoute = () => {
	const id = useRouteParameter('id');
	const callUrlParam = useSearchParameter('callUrl');

	// `?callUrl=` carries a provider-supplied external URL: hand the user off to the provider's own UI.
	if (callUrlParam) {
		return (
			<AuthenticationCheck guest loading={conferenceLoading}>
				<ConferencePage />
			</AuthenticationCheck>
		);
	}

	// A conference id opens the in-app conference: the call beside its persistent chat. Guests can't be
	// members of the conference's room, so authentication is required here.
	if (id) {
		return (
			<AuthenticationCheck guest={false} loading={conferenceLoading}>
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
