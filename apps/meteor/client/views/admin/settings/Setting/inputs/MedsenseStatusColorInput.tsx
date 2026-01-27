import { Box, Table, TableBody, TableCell, TableHead, TableRow, Select, Tag } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

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

const MedsenseStatusColorInput = ({ value, onChangeValue }: { value?: any; onChangeValue?: (val: string) => void }) => {
    const { t } = useTranslation();

    const colors = useMemo(() => {
        try {
            // value might be object if Rocket.Chat parses it, or string
            if (typeof value === 'object') return value;
            return value ? JSON.parse(value) : {};
        } catch {
            return {};
        }
    }, [value]);

    const handleColorChange = (status: string, color: string) => {
        const newColors = { ...colors, [status]: color };
        onChangeValue?.(JSON.stringify(newColors));
    };

    return (
        <Box display='flex' flexDirection='column' w='full'>
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
                                    onChange={(val) => handleColorChange(status, String(val))}
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
    );
};

export default MedsenseStatusColorInput;
