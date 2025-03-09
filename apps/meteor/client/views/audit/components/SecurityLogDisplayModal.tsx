import { Box, CodeSnippet } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useSettingStructure } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../components/GenericModal';
import { InfoPanelLabel, InfoPanelText } from '../../../components/InfoPanel';

type SecurityLogDisplayProps = {
	timestamp: string;
	actor: string;
	setting: string;
	changedFrom: string;
	changedTo: string;
	onCancel: () => void;
};

export const SecurityLogDisplay = ({ timestamp, actor, setting, changedFrom, changedTo, onCancel }: SecurityLogDisplayProps) => {
	const { t } = useTranslation();
	const settingStructure = useSettingStructure(setting);
	return (
		<GenericModal icon={null} onClose={onCancel} title={t('Setting_change')}>
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
			{settingStructure?.type === 'code' ? <CodeSnippet>{changedFrom}</CodeSnippet> : <InfoPanelText>{changedFrom}</InfoPanelText>}

			<InfoPanelLabel>{t('Changed_to')}</InfoPanelLabel>
			{settingStructure?.type === 'code' ? <CodeSnippet>{changedTo}</CodeSnippet> : <InfoPanelText>{changedTo}</InfoPanelText>}
		</GenericModal>
	);
};
