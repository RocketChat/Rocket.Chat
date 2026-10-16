import { ItemContent, ItemDescription, ItemMeta, ItemTitle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type ComposerBoxPopupSlashCommandProps = {
	_id: string;
	description?: string;
	params?: string;
	disabled?: boolean;
};

function ComposerBoxPopupSlashCommand({ _id, description, params, disabled }: ComposerBoxPopupSlashCommandProps) {
	const { t } = useTranslation();
	const meta = disabled ? t('Unavailable_in_encrypted_channels') : description;

	return (
		<>
			<ItemContent>
				<ItemTitle>
					{_id}
					{params && <ItemDescription inline>{params}</ItemDescription>}
				</ItemTitle>
			</ItemContent>
			{meta && (
				<ItemMeta truncate title={meta}>
					{meta}
				</ItemMeta>
			)}
		</>
	);
}

export default ComposerBoxPopupSlashCommand;
