import { Box, Select } from '@rocket.chat/fuselage';
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

const COLOR_PREVIEW_STYLES: Record<string, { background: string; color: string; border: string }> = {
    primary: { background: '#1d74f5', color: '#ffffff', border: '#1d74f5' },
    danger: { background: '#d64541', color: '#ffffff', border: '#d64541' },
    warning: { background: '#f5a623', color: '#1f2329', border: '#f5a623' },
    featured: { background: '#7c3aed', color: '#ffffff', border: '#7c3aed' },
    secondary: { background: '#6b7280', color: '#ffffff', border: '#6b7280' },
    default: { background: '#e5e7eb', color: '#1f2329', border: '#cbd5e1' },
};

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
            <Box display='flex' flexDirection='column' borderWidth='default' borderColor='extra-light' borderRadius='x4'>
                {STATUS_KEYS.map((status, index) => (
                    <Box
                        key={status}
                        display='flex'
                        justifyContent='space-between'
                        alignItems='center'
                        pi='x16'
                        pb='x12'
                        pt='x12'
                        flexWrap='wrap'
                        borderBlockEndWidth={index === STATUS_KEYS.length - 1 ? 'none' : 'default'}
                        borderColor='extra-light'
                    >
                        <Box display='flex' flexDirection='column' mie='x16'>
                            <Box fontScale='p2m'>{formatStatus(status)}</Box>
                            <Box display='flex' alignItems='center' flexWrap='wrap'>
                                <Box fontScale='c1' color='hint' mie='x8'>
                                    {t('Color')}: {colors[status] || 'default'}
                                </Box>
                                <Box
                                    is='span'
                                    fontScale='c1'
                                    pi='x8'
                                    pb='x2'
                                    pt='x2'
                                    borderRadius='x999'
                                    style={{
                                        background: COLOR_PREVIEW_STYLES[colors[status] || 'default']?.background || COLOR_PREVIEW_STYLES.default.background,
                                        color: COLOR_PREVIEW_STYLES[colors[status] || 'default']?.color || COLOR_PREVIEW_STYLES.default.color,
                                        border: `1px solid ${COLOR_PREVIEW_STYLES[colors[status] || 'default']?.border || COLOR_PREVIEW_STYLES.default.border}`,
                                    }}
                                >
                                    {formatStatus(status)}
                                </Box>
                            </Box>
                        </Box>
                        <Box minWidth='x180'>
                            <Select
                                options={COLOR_OPTIONS}
                                value={colors[status] || 'default'}
                                onChange={(val) => handleColorChange(status, String(val))}
                            />
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default MedsenseStatusColorInput;
