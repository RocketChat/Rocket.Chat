import { Field, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

type PasskeyEditModalProps = {
	initialName: string | null;
	onConfirm: (name: string) => void;
	onClose: () => void;
};

const PasskeyEditModal = ({ initialName, onConfirm, onClose }: PasskeyEditModalProps): ReactElement => {
	const { t } = useTranslation();
	const [name, setName] = useState(initialName);

	const handleConfirm = () => {
		if (name && name.trim()) {
			onConfirm(name.trim());
		}
	};

	return (
		<GenericModal title={t('Edit')} onConfirm={handleConfirm} onClose={onClose} confirmText={t('Save')}>
			<Field>
				<FieldLabel>{t('Passkey_name')}</FieldLabel>
				<FieldRow>
					<TextInput value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.currentTarget.value)} placeholder='' />
				</FieldRow>
			</Field>
		</GenericModal>
	);
};

export default PasskeyEditModal;
