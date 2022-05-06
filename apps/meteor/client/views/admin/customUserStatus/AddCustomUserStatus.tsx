import { Button, ButtonGroup, TextInput, Field, Select, SelectOption } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, SyntheticEvent, useCallback, useState } from 'react';

import VerticalBar from '../../../components/VerticalBar';

type AddCustomUserStatusProps = {
	goToNew: (id: string) => () => void;
	close: () => void;
	onChange: () => void;
};

function AddCustomUserStatus({ goToNew, close, onChange, ...props }: AddCustomUserStatusProps): ReactElement {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [name, setName] = useState('');
	const [statusType, setStatusType] = useState('online');

	const saveStatus = useMethod('insertOrUpdateUserStatus');
	const handleSave = useCallback(async () => {
		try {
			const result = await saveStatus({
				name,
				statusType,
			});
			dispatchToastMessage({
				type: 'success',
				message: t('Custom_User_Status_Updated_Successfully'),
			});
			goToNew(result)();
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: String(error) });
		}
	}, [dispatchToastMessage, goToNew, name, onChange, saveStatus, statusType, t]);

	const presenceOptions: SelectOption[] = [
		['online', t('Online')],
		['busy', t('Busy')],
		['away', t('Away')],
		['offline', t('Offline')],
	];

	return (
		<VerticalBar.ScrollableContent {...props}>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput
						value={name}
						onChange={(e: SyntheticEvent<HTMLInputElement>): void => setName(e.currentTarget.value)}
						placeholder={t('Name')}
					/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Presence')}</Field.Label>
				<Field.Row>
					<Select
						value={statusType}
						onChange={(value): void => setStatusType(value)}
						placeholder={t('Presence')}
						options={presenceOptions}
					/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button mie='x4' onClick={close}>
							{t('Cancel')}
						</Button>
						<Button primary onClick={handleSave} disabled={name === ''}>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
		</VerticalBar.ScrollableContent>
	);
}

export default AddCustomUserStatus;
