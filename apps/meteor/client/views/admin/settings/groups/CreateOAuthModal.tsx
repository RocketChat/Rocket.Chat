import { TextInput, Field } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, FormEvent } from 'react';
import React, { useState } from 'react';

import GenericModal from '../../../../components/GenericModal';

type CreateOAuthModalProps = {
	onConfirm: (text: string) => Promise<void>;
	onClose: () => void;
};

const CreateOAuthModal = ({ onConfirm, onClose }: CreateOAuthModalProps): ReactElement => {
	const [text, setText] = useState<string>('');
	const [error, setError] = useState<string>('');
	const t = useTranslation();

	const handleConfirm = (): void => {
		if (!text.length) {
			setError(t('Name_cant_be_empty'));
			return;
		}
		onConfirm(text);
	};

	return (
		<GenericModal title={t('Add_custom_oauth')} confirmText={t('Add')} onCancel={onClose} onClose={onClose} onConfirm={handleConfirm}>
			<Field>
				<Field.Label>{t('Give_a_unique_name_for_the_custom_oauth')}</Field.Label>
				<Field.Row>
					<TextInput
						error={error}
						placeholder={t('Custom_oauth_unique_name')}
						value={text}
						onChange={(e: FormEvent<HTMLInputElement>): void => {
							setText(e.currentTarget.value);
							setError('');
						}}
					/>
				</Field.Row>
				{error && <Field.Error>{error}</Field.Error>}
			</Field>
		</GenericModal>
	);
};

export default CreateOAuthModal;
