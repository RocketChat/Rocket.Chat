import { useRouteParameter } from '@rocket.chat/ui-contexts';

import { TemplateActivityWithData } from './tabs/TemplateActivity';

type ContactInfoActivityRouterProps = {
	onClickBack: () => void;
	onClose: () => void;
};

const ContactInfoActivityRouter = ({ onClickBack, onClose }: ContactInfoActivityRouterProps) => {
	const context = useRouteParameter('context');
	const contextId = useRouteParameter('contextId');

	if (context !== 'activity' || !contextId) {
		return null;
	}

	return <TemplateActivityWithData activityId={contextId} onClickBack={onClickBack} onClose={onClose} />;
};

export default ContactInfoActivityRouter;
