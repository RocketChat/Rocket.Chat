import { useRouteParameter } from '@rocket.chat/ui-contexts';

import ConferenceEmbeddedPage from './ConferenceEmbeddedPage';
import ConferencePageError from './ConferencePageError';
import ConferenceRedirectPage from './ConferenceRedirectPage';
import ConferenceScheduledPage from './ConferenceScheduledPage';
import AuthenticationCheck from '../root/MainLayout/AuthenticationCheck';

const getQueryParams = () => {
	const urlParams = new URLSearchParams(window.location.search);
	return { callUrlParam: urlParams.get('callUrl'), scheduled: urlParams.get('scheduled') };
};

const ConferenceRoute = () => {
	const id = useRouteParameter('id');
	const { callUrlParam, scheduled } = getQueryParams();

	if (callUrlParam) {
		return (
			<AuthenticationCheck>
				<ConferenceRedirectPage callUrl={callUrlParam} />
			</AuthenticationCheck>
		);
	}

	if (id) {
		if (scheduled) {
			return (
				<AuthenticationCheck guest={false}>
					<ConferenceScheduledPage sipAlias={id} />
				</AuthenticationCheck>
			);
		}

		return (
			<AuthenticationCheck guest={false}>
				<ConferenceEmbeddedPage callId={id} />
			</AuthenticationCheck>
		);
	}

	return <ConferencePageError />;
};

export default ConferenceRoute;
