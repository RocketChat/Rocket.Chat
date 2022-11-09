import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo } from 'react';

const EmptyBody: FC<{ empty?: boolean }> = ({ empty }) => {
	const t = useTranslation();

	return (
		<Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' width='full' height='80%'>
			<Icon name={empty ? 'check' : 'warning'} size='x60' color='green' />
			<Box marginBlock='x4'>
				<Box is='h3' color='default' fontScale='h3'>
					{empty ? t('No_unreads') : t('Unread_Error')}
				</Box>
			</Box>
		</Box>
	);
};
export default memo(EmptyBody);
