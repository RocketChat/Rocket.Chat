import type { IOutgoingIntegration } from '@rocket.chat/core-typings';

import { IntegrationsHooksAddProps } from './IntegrationHooksAddProps';
import { IntegrationsHooksRemoveProps } from './IntegrationHooksRemoveProps';

export type IntegrationHooksEndpoints = {
    '/hooks/add/:integrationId/:userId/:token': {
        POST: (params: IntegrationsHooksAddProps) => IOutgoingIntegration | void;
    };

    '/hooks/add/:integrationId/:token': {
        POST: (params: IntegrationsHooksAddProps) => IOutgoingIntegration | void;
    };

    '/hooks/remove/:integrationId/:userId/:token': {
        POST: (params: IntegrationsHooksRemoveProps) => void;
    };

    '/hooks/remove/:integrationId/:token': {
        POST: (params: IntegrationsHooksRemoveProps) => void;
    };
};
