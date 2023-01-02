import { Modal, Button, Accordion } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import DescriptionList from './DescriptionList';

const InstancesModal = ({ instances = [], onClose }) => {
	const t = useTranslation();

	const formatDateAndTime = useFormatDateAndTime();

	return (
		<Modal width='x600'>
			<Modal.Header>
				<Modal.Title>{t('Instances')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Accordion>
					{instances.map(({ address, broadcastAuth, currentStatus, instanceRecord }) => (
						<Accordion.Item title={address} key={address}>
							<DescriptionList>
								<DescriptionList.Entry label={t('Address')}>{address}</DescriptionList.Entry>
								<DescriptionList.Entry label={t('Auth')}>{broadcastAuth ? 'true' : 'false'}</DescriptionList.Entry>
								<DescriptionList.Entry
									label={
										<>
											{t('Current_Status')} &gt; {t('Connected')}
										</>
									}
								>
									{currentStatus.connected ? 'true' : 'false'}
								</DescriptionList.Entry>
								<DescriptionList.Entry
									label={
										<>
											{t('Current_Status')} &gt; {t('Retry_Count')}
										</>
									}
								>
									{currentStatus.retryCount}
								</DescriptionList.Entry>
								<DescriptionList.Entry
									label={
										<>
											{t('Current_Status')} &gt; {t('Status')}
										</>
									}
								>
									{currentStatus.status}
								</DescriptionList.Entry>
								<DescriptionList.Entry
									label={
										<>
											{t('Instance_Record')} &gt; {t('ID')}
										</>
									}
								>
									{instanceRecord._id}
								</DescriptionList.Entry>
								<DescriptionList.Entry
									label={
										<>
											{t('Instance_Record')} &gt; {t('PID')}
										</>
									}
								>
									{instanceRecord.pid}
								</DescriptionList.Entry>
								<DescriptionList.Entry
									label={
										<>
											{t('Instance_Record')} &gt; {t('Created_at')}
										</>
									}
								>
									{formatDateAndTime(instanceRecord._createdAt)}
								</DescriptionList.Entry>
								<DescriptionList.Entry
									label={
										<>
											{t('Instance_Record')} &gt; {t('Updated_at')}
										</>
									}
								>
									{formatDateAndTime(instanceRecord._updatedAt)}
								</DescriptionList.Entry>
							</DescriptionList>
						</Accordion.Item>
					))}
				</Accordion>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button primary onClick={onClose}>
						{t('Close')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default InstancesModal;
