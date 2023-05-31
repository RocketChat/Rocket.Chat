import type { IRoom } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, Select, FieldGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useState, useMemo } from 'react';

import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
} from '../../../../components/Contextualbar';
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
			<ContextualbarHeader>
				<ContextualbarIcon name='mail' />
				<ContextualbarTitle>{t('Export_Messages')}</ContextualbarTitle>
				<ContextualbarClose onClick={close} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<FieldGroup>
					<Field>
						<Field.Label>{t('Method')}</Field.Label>
						<Field.Row>
							<Select value={type} onChange={setType} placeholder={t('Type')} options={exportOptions} />
						</Field.Row>
					</Field>
				</FieldGroup>
				{type && type === 'file' && <FileExport rid={rid} onCancel={close} />}
				{type && type === 'email' && <MailExportForm rid={rid} onCancel={close} />}
			</ContextualbarScrollableContent>
		</>
	);
};

export default ExportMessages;
