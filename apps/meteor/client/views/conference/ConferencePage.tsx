import { useRouteParameter } from '@rocket.chat/ui-contexts';

import ConferenceInlinePage from './ConferenceInlinePage';
import ConferencePageError from './ConferencePageError';
import ConferenceRedirectPage from './ConferenceRedirectPage';

const getQueryParams = () => {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const callUrlParam = urlParams.get('callUrl');

	return { callUrlParam };
};

const ConferencePage = () => {
	const id = useRouteParameter('id');
	const { callUrlParam } = getQueryParams();

	if (callUrlParam) {
		return <ConferenceRedirectPage callUrl={callUrlParam} />;
	}

	if (id) {
		return <ConferenceInlinePage callId={id} />;
	}

	return <ConferencePageError />;
};

export default ConferencePage;
