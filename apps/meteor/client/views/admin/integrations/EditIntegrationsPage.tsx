import { useRouteParameter } from '@rocket.chat/ui-contexts';

import EditIncomingWebhook from './incoming/EditIncomingWebhook';
import EditOutgoingWebhook from './outgoing/EditOutgoingWebhook';

const EditIntegrationsPage = () => {
	const type = useRouteParameter('type');

	if (type === 'outgoing') {
		return <EditOutgoingWebhook />;
	}

	return <EditIncomingWebhook />;
};

export default EditIntegrationsPage;
