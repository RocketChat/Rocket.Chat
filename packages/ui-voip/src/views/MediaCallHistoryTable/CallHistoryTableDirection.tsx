import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

const CallHistoryTableDirection = ({ direction }: { direction: 'outbound' | 'inbound' }) => {
	const { t } = useTranslation();
	const iconName = direction === 'outbound' ? 'arrow-up-right' : 'arrow-down-left';
	return (
		<Box display='flex' flexDirection='row' alignItems='center'>
			<Icon name={iconName} color='primary' size={20} mie={8} />
			{t('Voice')}
		</Box>
	);
};

export default CallHistoryTableDirection;
