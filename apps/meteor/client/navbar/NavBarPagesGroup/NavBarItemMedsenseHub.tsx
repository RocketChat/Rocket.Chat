
import { SidebarV2Action } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMedsenseHubActions } from './hooks/useMedsenseHubActions';
import { MedicalIcon } from '../../views/medsense/icons/MedicalIcon';
import { useUiKitActionManager } from '../../uikit/hooks/useUiKitActionManager';

type MedsenseHubProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemMedsenseHub = (props: MedsenseHubProps) => {
    const { t } = useTranslation();
    const actionManager = useUiKitActionManager();
    const hasPermission = usePermission('medsense-view-hub');

    // Fetch Actions
    const { data: actions = [] } = useMedsenseHubActions();
    const executeAction = useEndpoint('POST', '/v1/medsense/hub.execute');

    const items = useMemo(() => {
        const normalizedActions = Array.isArray(actions) ? actions : [];
        return normalizedActions.map((action: any) => ({
            id: action.id,
            icon: action.icon || 'star',
            content: action.label,
            onClick: async () => {
                try {
                    const { view } = await executeAction({ actionId: action.id });
                    actionManager.openView('modal', view);
                } catch (error) {
                    console.error('Failed to execute hub action', error);
                }
            }
        }));
    }, [actionManager, actions, executeAction]);

    if (!hasPermission) {
        return null;
    }

    return (
        <GenericMenu
            title={t('Medsense_Hub')}
            items={items}
            icon={null as any}
            button={
                <SidebarV2Action aria-label={t('Medsense_Hub')} {...props}>
                    <MedicalIcon />
                </SidebarV2Action>
            }
        />
    );
};

export default NavBarItemMedsenseHub;
