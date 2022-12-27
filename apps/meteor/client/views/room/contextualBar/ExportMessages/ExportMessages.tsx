import type { IRoom } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, Select, FieldGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useState, useMemo } from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import { useTabBarClose } from '../../contexts/ToolboxContext';
import FileExport from './FileExport';
import MailExportForm from './MailExportForm';

type ExportMessagesProps = {
	rid: IRoom['_id'];
};
const ExportMessages: FC<ExportMessagesProps> = ({ rid }) => {
	const t = useTranslation();
	const close = useTabBarClose();

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
			<VerticalBar.Header>
				{t('Export_Messages')}
				<VerticalBar.Close onClick={close} />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<FieldGroup>
					<Field>
						<Field.Label>{t('Method')}</Field.Label>
						<Field.Row>
							<Select value={type} onChange={(value): void => setType(value)} placeholder={t('Type')} options={exportOptions} />
						</Field.Row>
					</Field>
				</FieldGroup>
				{type && type === 'file' && <FileExport rid={rid} onCancel={close} />}
				{type && type === 'email' && <MailExportForm rid={rid} onCancel={close} />}
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default ExportMessages;
