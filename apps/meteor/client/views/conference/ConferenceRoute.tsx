import { ConferenceViewport, ConferenceWindow } from '@rocket.chat/ui-conference';
import { useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';

import ConferencePage from './ConferencePage';
import ConferencePageError from './ConferencePageError';
import ConferenceScheduledPage from './ConferenceScheduledPage';
import ConferenceStartPage from './ConferenceStartPage';
import { NEW_CONFERENCE_ID } from './lib/callWindow';
import ConferenceProvider from './providers/ConferenceProvider';
import AuthenticationCheck from '../root/MainLayout/AuthenticationCheck';
import PageLoading from '../root/PageLoading';

const ConferenceRoute = () => {
	const id = useRouteParameter('id');
	const callUrlParam = useSearchParameter('callUrl');
	const rid = useSearchParameter('rid');
	const scheduled = useSearchParameter('scheduled');

	if (callUrlParam) {
		return (
			<AuthenticationCheck guest loadingElement={<PageLoading />}>
				<ConferencePage />
			</AuthenticationCheck>
		);
	}

	if (id === NEW_CONFERENCE_ID && rid) {
		return (
			<AuthenticationCheck guest={false} loadingElement={<PageLoading />}>
				<ConferenceViewport>
					<ConferenceStartPage rid={rid} />
				</ConferenceViewport>
			</AuthenticationCheck>
		);
	}

	// The id is the number that was dialled rather than a conference's, and may not stand for one yet.
	if (id && scheduled) {
		return (
			<AuthenticationCheck guest={false} loadingElement={<PageLoading />}>
				<ConferenceViewport>
					<ConferenceScheduledPage sipAlias={id} />
				</ConferenceViewport>
			</AuthenticationCheck>
		);
	}

	if (id) {
		return (
			<AuthenticationCheck guest={false} loadingElement={<PageLoading />}>
				<ConferenceViewport>
					{/* The window is the package's and reaches nothing; everything it is told comes from here. */}
					<ConferenceProvider callId={id}>
						<ConferenceWindow />
					</ConferenceProvider>
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
