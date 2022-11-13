import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo, ReactNode } from 'react';

type ResultMessageProps = {
	empty?: boolean;
	children?: ReactNode;
};
const ResultMessage: FC<ResultMessageProps> = ({ empty, children }) => {
	const t = useTranslation();
	return (
		<Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' width='full' height='80%'>
			<Icon name={empty ? 'check' : 'warning'} size='x60' color={empty ? 'green' : 'red'} />
			<Box marginBlock='x4'>
				<Box is='h4' color='default' fontScale='h4' textAlign='center' margin={20}>
					{empty ? t('No_unreads') : t('Unread_Error')}
				</Box>
				{children}
			</Box>
		</Box>
	);
};
export default memo(ResultMessage);
