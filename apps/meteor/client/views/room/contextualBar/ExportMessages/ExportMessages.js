import { Field, Select, FieldGroup } from '@rocket.chat/fuselage';
import React, { useState, useMemo } from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useTabBarClose } from '../../providers/ToolboxProvider';
import FileExport from './FileExport';
import MailExportForm from './MailExportForm';

function ExportMessages({ rid }) {
	const t = useTranslation();
	const close = useTabBarClose();

	const [type, setType] = useState('email');

	const exportOptions = useMemo(
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
							<Select value={type} onChange={(value) => setType(value)} placeholder={t('Type')} options={exportOptions} />
						</Field.Row>
					</Field>
				</FieldGroup>
				{type && type === 'file' && <FileExport rid={rid} onCancel={close} />}
				{type && type === 'email' && <MailExportForm rid={rid} onCancel={close} />}
			</VerticalBar.ScrollableContent>
		</>
	);
}

export default ExportMessages;
