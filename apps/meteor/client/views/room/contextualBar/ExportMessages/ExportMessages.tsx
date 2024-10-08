import type { SelectOption } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { ContextualbarHeader, ContextualbarIcon, ContextualbarTitle, ContextualbarClose } from '../../../../components/Contextualbar';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';
import FileExport from './FileExport';
import MailExportForm from './MailExportForm';

export type MailExportFormValues = {
	type: 'email' | 'file';
	dateFrom: string;
	dateTo: string;
	format: 'html' | 'json';
	toUsers: string[];
	additionalEmails: string;
	messagesCount: number;
	subject: string;
};

const ExportMessages = () => {
	const t = useTranslation();
	const room = useRoom();

	const { closeTab } = useRoomToolbox();

	const roomName = room?.t && roomCoordinator.getRoomName(room.t, room);

	const methods = useForm<MailExportFormValues>({
		mode: 'onBlur',
		defaultValues: {
			type: 'email',
			dateFrom: '',
			dateTo: '',
			toUsers: [],
			additionalEmails: '',
			messagesCount: 0,
			subject: t('Mail_Messages_Subject', {
				postProcess: 'sprintf',
				sprintf: [roomName],
			}),
			format: 'html',
		},
	});
	const exportOptions = useMemo<SelectOption[]>(
		() => [
			['email', t('Send_via_email')],
			['file', t('Export_as_file')],
		],
		[t],
	);

	const formId = useUniqueId();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='mail' />
				<ContextualbarTitle id={`${formId}-title`}>{t('Export_Messages')}</ContextualbarTitle>
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>
			<FormProvider {...methods}>
				{methods.watch('type') === 'email' && (
					<MailExportForm formId={formId} rid={room._id} exportOptions={exportOptions} onCancel={closeTab} />
				)}
				{methods.watch('type') === 'file' && (
					<FileExport formId={formId} rid={room._id} exportOptions={exportOptions} onCancel={closeTab} />
				)}
			</FormProvider>
		</>
	);
};

export default ExportMessages;
