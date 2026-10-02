import { Box, ItemContent, ItemDescription, ItemTitle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type ComposerBoxPopupSlashCommandProps = {
	_id: string;
	description?: string;
	params?: string;
	disabled?: boolean;
};

function ComposerBoxPopupSlashCommand({ _id, description, params, disabled }: ComposerBoxPopupSlashCommandProps) {
	const { t } = useTranslation();

	return (
		<>
			<ItemContent>
				<ItemTitle>
					{_id}
					{params && <ItemDescription inline>{params}</ItemDescription>}
				</ItemTitle>
			</ItemContent>
			<Box is={ItemContent} textAlign='end'>
				<ItemDescription>{disabled ? t('Unavailable_in_encrypted_channels') : description}</ItemDescription>
			</Box>
		</>
	);
}

export default ComposerBoxPopupSlashCommand;
