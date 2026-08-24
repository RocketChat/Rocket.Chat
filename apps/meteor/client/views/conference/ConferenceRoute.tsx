import { useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';

import ConferenceEmbeddedPage from './ConferenceEmbeddedPage';
import ConferencePage from './ConferencePage';
import ConferencePageError from './ConferencePageError';
import ConferenceStartPage from './ConferenceStartPage';
import ConferenceViewport from './ConferenceViewport';
import { NEW_CONFERENCE_ID } from './lib/callWindow';
import AuthenticationCheck from '../root/MainLayout/AuthenticationCheck';
import PageLoading from '../root/PageLoading';

const conferenceLoading = <PageLoading />;

const ConferenceRoute = () => {
	const id = useRouteParameter('id');
	const callUrlParam = useSearchParameter('callUrl');
	const rid = useSearchParameter('rid');

	if (callUrlParam) {
		return (
			<AuthenticationCheck guest loading={conferenceLoading}>
				<ConferencePage />
			</AuthenticationCheck>
		);
	}

	if (id === NEW_CONFERENCE_ID && rid) {
		return (
			<AuthenticationCheck guest={false} loading={conferenceLoading}>
				<ConferenceViewport>
					<ConferenceStartPage rid={rid} />
				</ConferenceViewport>
			</AuthenticationCheck>
		);
	}

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
