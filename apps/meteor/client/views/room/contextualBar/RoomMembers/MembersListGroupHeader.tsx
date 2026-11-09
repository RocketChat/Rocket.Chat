import { ItemGroupHeader, ItemGroupTitle } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import MembersListGroupHeaderSurface from './layout/MembersListGroupHeaderSurface';

export type MembersListGroupHeaderProps = {
	title: TranslationKey;
	count: number;
	isFirst?: boolean;
};

export const MembersListGroupHeader = ({ title, count, isFirst = false }: MembersListGroupHeaderProps) => {
	const { t } = useTranslation();

	return (
		<MembersListGroupHeaderSurface first={isFirst}>
			<ItemGroupHeader inset='lg'>
				<ItemGroupTitle>
					{t(title)} ({count})
				</ItemGroupTitle>
			</ItemGroupHeader>
		</MembersListGroupHeaderSurface>
	);
};
