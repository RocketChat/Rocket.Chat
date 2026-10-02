import { Box, ItemDivider, ItemGroupHeader, ItemGroupTitle, ItemMeta } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

export type MembersListDividerProps = {
	title: TranslationKey;
	count: number;
};

export const MembersListDivider = ({ title, count }: MembersListDividerProps) => {
	const { t } = useTranslation();

	return (
		<Box key={title} backgroundColor='room'>
			<ItemGroupHeader inset='lg'>
				<ItemGroupTitle>{t(title)}</ItemGroupTitle>
				<ItemMeta>{count}</ItemMeta>
			</ItemGroupHeader>
			<ItemDivider />
		</Box>
	);
};
