import type { IAuditServerUserActor, IAuditServerSystemActor, IAuditServerAppActor } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { AppInfoField } from './AppInfoField';
import AuditModalField from './AuditModalField';
import AuditModalLabel from './AuditModalLabel';
import AuditModalText from './AuditModalText';
import GenericModal from '../../../components/GenericModal';

type SecurityLogDisplayProps = {
	timestamp: string;
	actor: IAuditServerUserActor | IAuditServerSystemActor | IAuditServerAppActor;
	setting: string;
	changedFrom: string;
	changedTo: string;
	onCancel: () => void;
};

const SecurityLogDisplayModal = ({ timestamp, actor, setting, changedFrom, changedTo, onCancel }: SecurityLogDisplayProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal maxHeight={550} icon={null} onClose={onCancel} title={t('Setting_change')}>
			<AuditModalField>
				<AuditModalLabel>{t('Timestamp')}</AuditModalLabel>
				<AuditModalText>{format(new Date(timestamp), 'MMMM d yyyy, h:mm:ss a')}</AuditModalText>
			</AuditModalField>

			{actor.type === 'user' && (
				<AuditModalField>
					<AuditModalLabel>{t('Actor')}</AuditModalLabel>
					<Box display='flex' alignItems='center'>
						{actor.type === 'user' && <UserAvatar size='x24' userId={actor._id} />}
						<Box
							mi={actor.type === 'user' ? 8 : 0}
							fontScale='p2m'
							display='flex'
							flexDirection='column'
							alignSelf='center'
							withTruncatedText
						>
							{actor.username}
						</Box>
					</Box>
				</AuditModalField>
			)}

			{actor.type === 'app' && <AppInfoField appId={actor._id} />}

			{actor.type === 'system' && (
				<>
					<AuditModalField>
						<AuditModalLabel>{t('Actor')}</AuditModalLabel>
						<AuditModalText>{t('System')}</AuditModalText>
					</AuditModalField>

					<AuditModalField>
						<AuditModalLabel>{t('Reason')}</AuditModalLabel>
						<AuditModalText>{actor.reason}</AuditModalText>
					</AuditModalField>
				</>
			)}

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
