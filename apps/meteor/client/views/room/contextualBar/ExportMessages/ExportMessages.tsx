import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, Select, FieldGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useMemo } from 'react';

import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
} from '../../../../components/Contextualbar';
import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';
import FileExport from './FileExport';
import MailExportForm from './MailExportForm';

const ExportMessages = () => {
	const t = useTranslation();
	const room = useRoom();
	const { closeTab } = useRoomToolbox();

	const [type, setType] = useState('email');

	const exportOptions = useMemo<SelectOption[]>(
		() => [
			['email', t('Send_via_email')],
			['file', t('Export_as_file')],
		],
		[t],
	);

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='mail' />
				<ContextualbarTitle>{t('Export_Messages')}</ContextualbarTitle>
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<FieldGroup>
					<Field>
						<Field.Label>{t('Method')}</Field.Label>
						<Field.Row>
							<Select value={type} onChange={(value) => setType(String(value))} placeholder={t('Type')} options={exportOptions} />
						</Field.Row>
					</Field>
				</FieldGroup>
				{type && type === 'file' && <FileExport rid={room._id} onCancel={closeTab} />}
				{type && type === 'email' && <MailExportForm rid={room._id} onCancel={closeTab} />}
			</ContextualbarScrollableContent>
		</>
	);
};

export default ExportMessages;
