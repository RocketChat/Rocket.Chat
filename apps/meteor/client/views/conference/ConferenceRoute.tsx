import { useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';

import ConferenceEmbeddedPage from './ConferenceEmbeddedPage';
import ConferencePage from './ConferencePage';
import ConferencePageError from './ConferencePageError';
import ConferenceStartPage from './ConferenceStartPage';
import ConferenceViewport from './ConferenceViewport';
import { NEW_CONFERENCE_ID } from './lib/callWindow';
import AuthenticationCheck from '../root/MainLayout/AuthenticationCheck';
import PageLoading from '../root/PageLoading';

// The conference renders standalone, so the auth chain's default app-shaped skeleton (sidebar, message
// list, composer) would flash chrome this page never shows. A plain spinner also matches what the
// conference itself shows while it loads, making the whole startup one continuous state.
const conferenceLoading = <PageLoading />;

const ConferenceRoute = () => {
	const id = useRouteParameter('id');
	const callUrlParam = useSearchParameter('callUrl');
	const rid = useSearchParameter('rid');

	// `?callUrl=` carries a provider-supplied external URL: hand the user off to the provider's own UI.
	if (callUrlParam) {
		return (
			<AuthenticationCheck guest loading={conferenceLoading}>
				<ConferencePage />
			</AuthenticationCheck>
		);
	}

	// No conference yet: the window was opened by clicking *call* in a room, and what starts the conference is
	// the preflight this shows. The id is a placeholder rather than a call — there is nothing to identify yet.
	if (id === NEW_CONFERENCE_ID && rid) {
		return (
			<AuthenticationCheck guest={false} loading={conferenceLoading}>
				<ConferenceViewport>
					<ConferenceStartPage rid={rid} />
				</ConferenceViewport>
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
