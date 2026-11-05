import { Box, ItemGroupHeader, ItemGroupTitle } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

export type MembersListGroupHeaderProps = {
	title: TranslationKey;
	count: number;
	isFirst?: boolean;
};

export const MembersListGroupHeader = ({ title, count, isFirst = false }: MembersListGroupHeaderProps) => {
	const { t } = useTranslation();

	return (
		<Box backgroundColor='room' paddingBlockStart={isFirst ? 0 : 8}>
			<ItemGroupHeader inset='lg'>
				<ItemGroupTitle>
					{t(title)} ({count})
				</ItemGroupTitle>
			</ItemGroupHeader>
		</Box>
	);
};
