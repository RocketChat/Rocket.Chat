import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../components/GenericModal';
import { InfoPanelLabel, InfoPanelText } from '../../../components/InfoPanel';

type SecurityLogDisplayProps = {
	timestamp: string;
	actor: string;
	actorId: string;
	setting: string;
	changedFrom: string;
	changedTo: string;
	onCancel: () => void;
};

const SecurityLogDisplayModal = ({ timestamp, actor, actorId, setting, changedFrom, changedTo, onCancel }: SecurityLogDisplayProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal icon={null} onClose={onCancel} title={t('Setting_change')}>
			<InfoPanelLabel>{t('Timestamp')}</InfoPanelLabel>
			<InfoPanelText>{format(new Date(timestamp), 'MMMM d yyyy, h:mm:ss a')}</InfoPanelText>

			<InfoPanelLabel>{t('Actor')}</InfoPanelLabel>

			<Box display='flex' alignItems='center' mbe={16}>
				<UserAvatar size='x24' username={actorId} />
				<Box mi={8} fontScale='p2m' display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
					{actor}
				</Box>
			</Box>

			<InfoPanelLabel>{t('Setting')}</InfoPanelLabel>
			<InfoPanelText>{t(setting)}</InfoPanelText>

			<InfoPanelLabel>{t('Changed_from')}</InfoPanelLabel>
			<InfoPanelText>{changedFrom}</InfoPanelText>

			<InfoPanelLabel>{t('Changed_to')}</InfoPanelLabel>
			<InfoPanelText>{changedTo}</InfoPanelText>
		</GenericModal>
	);
};

export default SecurityLogDisplayModal;
