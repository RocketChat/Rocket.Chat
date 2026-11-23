import { ItemGroupHeader, ItemGroupTitle } from '@rocket.chat/fuselage';
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
		<ItemGroupHeader inset='lg' insetBlock={isFirst ? undefined : 'md'} sticky>
			<ItemGroupTitle>
				{t(title)} ({count})
			</ItemGroupTitle>
		</ItemGroupHeader>
	);
};
