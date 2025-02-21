import { Box, Modal } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

import { CodeDisplay } from './CodeDisplay';
import { InfoPanelLabel, InfoPanelText } from '../../../components/InfoPanel';

type SecurityLogDisplayProps = {
	timestamp: string;
	actor: string;
	setting: string;
	settingType: 'string' | 'code';
	changedFrom: string;
	changedTo: string;
	onCancel: () => void;
};

export const SecurityLogDisplay = ({
	timestamp,
	actor,
	setting,
	settingType,
	changedFrom,
	changedTo,
	onCancel,
}: SecurityLogDisplayProps) => {
	const { t } = useTranslation();
	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Setting_change')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content mbe={16}>
				<InfoPanelLabel>{t('Timestamp')}</InfoPanelLabel>
				<InfoPanelText>{moment(timestamp).format('MMMM Do YYYY, h:mm:ss a')}</InfoPanelText>

				<InfoPanelLabel>{t('Actor')}</InfoPanelLabel>

				<Box display='flex' alignItems='center' mbe={16}>
					<UserAvatar size='x24' username={actor} />
					<Box display='flex' withTruncatedText mi={8}>
						<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
							<Box fontScale='p2m' withTruncatedText color='default'>
								{actor}
							</Box>
						</Box>
					</Box>
				</Box>

				<InfoPanelLabel>{t('Setting')}</InfoPanelLabel>
				<InfoPanelText>{t(setting)}</InfoPanelText>

				<InfoPanelLabel>{t('Changed_from')}</InfoPanelLabel>
				{settingType === 'code' ? <CodeDisplay code={changedFrom} /> : <InfoPanelText>{changedFrom}</InfoPanelText>}

				<InfoPanelLabel>{t('Changed_to')}</InfoPanelLabel>
				{settingType === 'code' ? <CodeDisplay code={changedTo} /> : <InfoPanelText>{changedTo}</InfoPanelText>}
			</Modal.Content>
		</Modal>
	);
};
