import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import AuditModalField from './AuditModalField';
import AuditModalLabel from './AuditModalLabel';
import AuditModalText from './AuditModalText';
import GenericModal from '../../../components/GenericModal';

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
		<GenericModal maxHeight={550} icon={null} onClose={onCancel} title={t('Setting_change')}>
			<AuditModalField>
				<AuditModalLabel>{t('Timestamp')}</AuditModalLabel>
				<AuditModalText>{format(new Date(timestamp), 'MMMM d yyyy, h:mm:ss a')}</AuditModalText>
			</AuditModalField>

			<AuditModalField>
				<AuditModalLabel>{t('Actor')}</AuditModalLabel>
				<Box display='flex' alignItems='center'>
					<UserAvatar size='x24' username={actorId} />
					<Box mi={8} fontScale='p2m' display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
						{actor}
					</Box>
				</Box>
			</AuditModalField>

			<AuditModalField>
				<AuditModalLabel>{t('Setting')}</AuditModalLabel>
				<AuditModalText>{t(setting)}</AuditModalText>
			</AuditModalField>

			<AuditModalField>
				<AuditModalLabel>{t('Changed_from')}</AuditModalLabel>
				<AuditModalText>{changedFrom}</AuditModalText>
			</AuditModalField>

			<AuditModalField>
				<AuditModalLabel>{t('Changed_to')}</AuditModalLabel>
				<AuditModalText>{changedTo}</AuditModalText>
			</AuditModalField>
		</GenericModal>
	);
};

export default SecurityLogDisplayModal;
