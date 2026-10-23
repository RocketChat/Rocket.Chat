import { Icon, Stack } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type CallHistoryTableDirectionProps = { direction: 'outbound' | 'inbound' };

const CallHistoryTableDirection = ({ direction }: CallHistoryTableDirectionProps) => {
	const { t } = useTranslation();
	const iconName = direction === 'outbound' ? 'arrow-up-right' : 'arrow-down-left';
	return (
		<Stack direction='row' align='center' gap={8}>
			<Icon name={iconName} size={20} />
			{t('Voice')}
		</Stack>
	);
};

export default CallHistoryTableDirection;
