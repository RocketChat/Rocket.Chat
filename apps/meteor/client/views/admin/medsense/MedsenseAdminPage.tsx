import {
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Select,
    Tag,
} from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import { Page, PageHeader, PageScrollableContent } from '@rocket.chat/ui-client';
import React, { useState, useMemo, useEffect } from 'react';

const STATUS_KEYS = [
    'waiting_patient',
    'ai_preassessment',
    'waiting_staff',
    'ready_for_staff',
    'taken',
    'closed',
];

const COLOR_OPTIONS: [string, string][] = [
    ['primary', 'Primary (Blue)'],
    ['danger', 'Danger (Red)'],
    ['warning', 'Warning (Orange)'],
    ['featured', 'Featured (Purple)'],
    ['secondary', 'Secondary (Grey)'],
    ['default', 'Default (Neutral)'],
];

const formatStatus = (status: string) => {
    const map: Record<string, string> = {
        waiting_patient: 'Waiting for patient',
        ai_preassessment: 'AI pre-assessment',
        waiting_staff: 'Waiting for staff',
        ready_for_staff: 'Ready for staff',
        taken: 'Taken',
        closed: 'Closed',
    };
    return map[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const MedsenseAdminPage = () => {
    const t = useTranslation();
    const dispatchToast = useToastMessageDispatch();

    const settingValue = useSetting('Medsense_Queue_Status_Colors') as string | undefined;
    const currentColors = useMemo(() => {
        const defaultColors: Record<string, string> = {
            waiting_patient: 'warning',
            ai_preassessment: 'secondary',
            waiting_staff: 'warning',
            ready_for_staff: 'featured',
            taken: 'primary',
            closed: 'secondary',
        };
        if (!settingValue) return defaultColors;
        try {
            return { ...defaultColors, ...JSON.parse(settingValue) };
        } catch {
            return defaultColors;
        }
    }, [settingValue]);

    const [colors, setColors] = useState<Record<string, string>>(currentColors);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setColors(currentColors);
    }, [currentColors]);

    const updateSetting = useEndpoint('POST', '/v1/settings/Medsense_Queue_Status_Colors');

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSetting({ value: JSON.stringify(colors) });
            dispatchToast({ type: 'success', message: t('Settings_updated') });
        } catch (error: any) {
            dispatchToast({ type: 'error', message: error });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Page>
            <PageHeader title="Medsense Settings">
                <Button primary onClick={handleSave} disabled={saving} loading={saving}>
                    {t('Save_changes')}
                </Button>
            </PageHeader>
            <PageScrollableContent>
                <Box p='x24' display='flex' flexDirection='column'>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('Status')}</TableCell>
                                <TableCell>{t('Color')}</TableCell>
                                <TableCell>{t('Preview')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {STATUS_KEYS.map((status) => (
                                <TableRow key={status}>
                                    <TableCell>{formatStatus(status)}</TableCell>
                                    <TableCell>
                                        <Select
                                            options={COLOR_OPTIONS}
                                            value={colors[status] || 'default'}
                                            onChange={(val) => setColors(prev => ({ ...prev, [status]: String(val) }))}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Tag variant={colors[status] as any}>{formatStatus(status)}</Tag>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </PageScrollableContent>
        </Page>
    );
};

export default MedsenseAdminPage;
