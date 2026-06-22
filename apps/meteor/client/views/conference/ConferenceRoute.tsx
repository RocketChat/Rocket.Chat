import { useRouteParameter } from '@rocket.chat/ui-contexts';

import ConferenceEmbeddedPage from './ConferenceEmbeddedPage';
import ConferencePageError from './ConferencePageError';
import ConferenceRedirectPage from './ConferenceRedirectPage';
import AuthenticationCheck from '../root/MainLayout/AuthenticationCheck';

const getQueryParams = () => {
	const urlParams = new URLSearchParams(window.location.search);
	return { callUrlParam: urlParams.get('callUrl') };
};

const ConferenceRoute = () => {
	const id = useRouteParameter('id');
	const { callUrlParam } = getQueryParams();

	if (callUrlParam) {
		return (
			<AuthenticationCheck>
				<ConferenceRedirectPage callUrl={callUrlParam} />
			</AuthenticationCheck>
		);
	}

	if (id) {
		return (
			<AuthenticationCheck guest={false}>
				<ConferenceEmbeddedPage callId={id} />
			</AuthenticationCheck>
		);
	}

	return <ConferencePageError />;
};

export default ConferenceRoute;
