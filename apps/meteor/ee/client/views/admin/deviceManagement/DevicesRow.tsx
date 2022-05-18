import { TableRow, TableCell, Icon, Box } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import React, { ComponentProps, ReactElement, FC } from 'react';
import { useFormatDateAndTime } from '../../../../../client/hooks/useFormatDateAndTime';

const iconMap: Record<string, ComponentProps<typeof Icon>['name']> = {
    browser: 'desktop',
    mobile: 'mobile',
};

const DeviceIcon: FC<{ deviceType: string }> = ({ deviceType }) =>
    <Box is='span' p='x4' bg='neutral-500-50' borderRadius='x32' mie='x4'><Icon name={iconMap[deviceType]} size='x20' color='info' /></Box>;


const DevicesRow = ({ _id, userId, ip, device: { name, type, os: { name:OSName } }, loginAt }: any): ReactElement => {

    const formatDateAndTime = useFormatDateAndTime();

    const mediaQuery = useMediaQuery('(min-width: 1024px)');

    return (
        <TableRow key={_id}>
            <TableCell>
                <DeviceIcon deviceType={type}/>
                {name}
            </TableCell>
            <TableCell>{OSName}</TableCell>
            <TableCell withTruncatedText>{userId}</TableCell>
            {mediaQuery && <TableCell>{formatDateAndTime(loginAt)}</TableCell>}
            {mediaQuery && <TableCell withTruncatedText>{_id}</TableCell>}
            {mediaQuery && <TableCell>{ip}</TableCell>}
        </TableRow>
    );
};

export default DevicesRow;
