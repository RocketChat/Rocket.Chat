import { useIsPrivilegedSettingsContext, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import AICenterOverview from './AICenterOverview';
import AISettingsSection from './AISettingsSection';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const AICenterRoute = (): ReactElement => {
	const hasPermission = useIsPrivilegedSettingsContext();
	const section = useRouteParameter('section');

	if (!hasPermission) {
		return <NotAuthorizedPage />;
	}

	if (section === 'search') {
		return <AISettingsSection section='Intelligent_Search' />;
	}

	if (section === 'llm-providers') {
		return <AISettingsSection section='AI_LLM_Provider' />;
	}

	if (section === 'mcp') {
		return <AISettingsSection section='MCP' />;
	}

	return <AICenterOverview />;
};

export default AICenterRoute;
