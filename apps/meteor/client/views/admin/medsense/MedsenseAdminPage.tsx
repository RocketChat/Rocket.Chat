import { Tabs } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageScrollableContent } from '@rocket.chat/ui-client';
import React, { useState } from 'react';

import { MedsenseSettingsTab } from './MedsenseSettingsTab';
import DocumentationTemplatesTab from './DocumentationTemplatesTab';
import DocumentationTemplateEditor from './DocumentationTemplateEditor';

const MedsenseAdminPage = () => {
    const [tab, setTab] = useState('settings');
    const [editingTemplateId, setEditingTemplateId] = useState<string | null | undefined>(undefined);

    const handleEditTemplate = (id: string | null) => {
        setEditingTemplateId(id);
    };

    const handleBackToList = () => {
        setEditingTemplateId(undefined);
    };

    return (
        <Page>
            <PageHeader title="Medsense Admin Settings" />
            <Tabs>
                <Tabs.Item selected={tab === 'settings'} onClick={() => { setTab('settings'); setEditingTemplateId(undefined); }}>Settings</Tabs.Item>
                <Tabs.Item selected={tab === 'templates'} onClick={() => { setTab('templates'); setEditingTemplateId(undefined); }}>Documentation Templates</Tabs.Item>
            </Tabs>
            <PageScrollableContent>
                {tab === 'settings' && <MedsenseSettingsTab />}
                {tab === 'templates' && editingTemplateId === undefined && (
                    <DocumentationTemplatesTab onEdit={handleEditTemplate} />
                )}
                {tab === 'templates' && editingTemplateId !== undefined && (
                    <DocumentationTemplateEditor templateId={editingTemplateId} onBack={handleBackToList} />
                )}
            </PageScrollableContent>
        </Page>
    );
};

export default MedsenseAdminPage;
