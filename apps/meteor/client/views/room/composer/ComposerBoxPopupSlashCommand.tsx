import { OptionContent, OptionDescription } from '@rocket.chat/fuselage';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

export type ComposerBoxPopupSlashCommandProps = {
	_id: string;
	description?: string;
	params?: string;
	disabled?: boolean;
};

const slashCommandDescriptionStyle: CSSProperties = { textAlign: 'right' };

function ComposerBoxPopupSlashCommand({ _id, description, params, disabled }: ComposerBoxPopupSlashCommandProps) {
	const { t } = useTranslation();

	return (
		<>
			<OptionContent>
				{_id} <OptionDescription>{params}</OptionDescription>
			</OptionContent>
			<OptionContent style={slashCommandDescriptionStyle}>{disabled ? t('Unavailable_in_encrypted_channels') : description}</OptionContent>
		</>
	);
}

export default ComposerBoxPopupSlashCommand;
