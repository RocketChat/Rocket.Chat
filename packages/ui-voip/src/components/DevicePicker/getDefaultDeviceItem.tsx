import { Box, RadioButton } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';

export const getDefaultDeviceItem = (label: string, type: 'input' | 'output'): GenericMenuItemProps => ({
    content: (
        <Box is='span' title={label} fontSize={14}>
            {label}
        </Box>
    ),
    addon: <RadioButton onChange={() => undefined} checked={true} disabled />,
    id: `default-${type}`,
});
