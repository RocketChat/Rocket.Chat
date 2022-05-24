import { TableRow, TableCell, Icon, Box, Menu, Option } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ComponentProps, ReactElement, FC } from 'react';
import { useFormatDateAndTime } from '../../../../../client/hooks/useFormatDateAndTime';

const iconMap: Record<string, ComponentProps<typeof Icon>['name']> = {
	browser: 'desktop',
	mobile: 'mobile',
};

const DeviceIcon: FC<{ deviceType: string }> = ({ deviceType }) =>
	<Box is='span' p='x4' bg='neutral-500-50' borderRadius='x32' mie='x4'><Icon name={iconMap[deviceType]} size='x20' color='info' /></Box>;


const DevicesRow = ({ _id, userId, ip, device: { name, type, os: { name:OSName } }, loginAt }: any): ReactElement => {

	const t = useTranslation();
	const deviceManagementRouter = useRoute('device-management');

	const formatDateAndTime = useFormatDateAndTime();

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const handleClick = () => {
		deviceManagementRouter.push({
			context: 'info',
			id: _id,
		})
	};

	return (
		<TableRow key={_id} onClick={handleClick} tabIndex={0}>
			<TableCell>
				<DeviceIcon deviceType={type}/>
				{name}
			</TableCell>
			<TableCell>{OSName}</TableCell>
			<TableCell withTruncatedText>{userId}</TableCell>
			{mediaQuery && <TableCell>{formatDateAndTime(loginAt)}</TableCell>}
			{mediaQuery && <TableCell withTruncatedText>{_id}</TableCell>}
			{mediaQuery && <TableCell>{ip}</TableCell>}
			<TableCell onClick={e => e.stopPropagation()}>
				<Menu
					title={t('Options')}
					options={{
						logout: {
							label: { label: t('Logout_Device'), icon: 'sign-out' },
							action: () => console.log("Logout"),
						},
					}}
					tabIndex={-1}
					renderItem={({ label: { label, icon }, props }) => <Option label={label} icon={icon} {...props} />}
				/>
			</TableCell>
		</TableRow>
	);
};

export default DevicesRow;
