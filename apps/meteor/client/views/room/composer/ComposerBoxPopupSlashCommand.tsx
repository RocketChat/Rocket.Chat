import { OptionColumn, OptionContent, OptionDescription, OptionInput } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

export type ComposerBoxPopupSlashCommandProps = {
	_id: string;
	description?: string;
	params?: string;
	disabled?: boolean;
};

function ComposerBoxPopupSlashCommand({ _id, description, params, disabled }: ComposerBoxPopupSlashCommandProps) {
	const t = useTranslation();

	return (
		<>
			<OptionContent>
				{_id} <OptionDescription>{params}</OptionDescription>
			</OptionContent>
			<OptionColumn>
				<OptionInput>{disabled ? t('Unavailable_in_encrypted_channels') : description}</OptionInput>
			</OptionColumn>
		</>
	);
}

export default ComposerBoxPopupSlashCommand;
