import { Accordion, AccordionItem } from '@rocket.chat/fuselage';
import type { IInstance } from '@rocket.chat/rest-typings';
import { useTranslation } from 'react-i18next';

import DescriptionList from './DescriptionList';
import DescriptionListEntry from './DescriptionListEntry';
import GenericModal from '../../../../../../components/GenericModal';
import { useFormatDateAndTime } from '../../../../../../hooks/useFormatDateAndTime';

type InstancesModalProps = {
	instances: IInstance[];
	onClose: () => void;
};

const InstancesModal = ({ instances = [], onClose }: InstancesModalProps) => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	return (
		<GenericModal onConfirm={onClose} confirmText={t('Close')} icon={null} title={t('Instances')} onClose={onClose}>
			<Accordion>
				{instances.map(({ address, broadcastAuth, currentStatus, instanceRecord }) => (
					<AccordionItem defaultExpanded title={address} key={address}>
						<DescriptionList>
							<DescriptionListEntry label={t('Address')}>{address}</DescriptionListEntry>
							<DescriptionListEntry label={t('Auth')}>{broadcastAuth ? 'true' : 'false'}</DescriptionListEntry>
							<DescriptionListEntry
								label={
									<>
										{t('Current_Status')} &gt; {t('Connected')}
									</>
								}
							>
								{currentStatus.connected ? 'true' : 'false'}
							</DescriptionListEntry>
							<DescriptionListEntry
								label={
									<>
										{t('Current_Status')} &gt; {t('Local')}
									</>
								}
							>
								{currentStatus.local ? 'true' : 'false'}
							</DescriptionListEntry>
							<DescriptionListEntry
								label={
									<>
										{t('Current_Status')} &gt; {t('Last_Heartbeat_Time')}
									</>
								}
							>
								{currentStatus.lastHeartbeatTime}
							</DescriptionListEntry>
							<DescriptionListEntry label={<>{t('Instance_Record')} &gt; ID</>}>{instanceRecord?._id}</DescriptionListEntry>
							<DescriptionListEntry
								label={
									<>
										{t('Instance_Record')} &gt; {t('PID')}
									</>
								}
							>
								{instanceRecord?.pid}
							</DescriptionListEntry>
							<DescriptionListEntry
								label={
									<>
										{t('Instance_Record')} &gt; {t('Created_at')}
									</>
								}
							>
								{formatDateAndTime(instanceRecord?._createdAt)}
							</DescriptionListEntry>
							<DescriptionListEntry
								label={
									<>
										{t('Instance_Record')} &gt; {t('Updated_at')}
									</>
								}
							>
								{formatDateAndTime(instanceRecord?._updatedAt)}
							</DescriptionListEntry>
						</DescriptionList>
					</AccordionItem>
				))}
			</Accordion>
		</GenericModal>
	);
};

export default InstancesModal;
