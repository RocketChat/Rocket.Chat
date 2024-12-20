import { Box } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

type MembersListDividerProps = {
	title: TranslationKey;
};

export const MembersListDivider = ({ title }: MembersListDividerProps) => {
	const { t } = useTranslation();

	return (
		<Box key={title} backgroundColor='room' height={36} fontScale='p2m' color='defaut' paddingBlock={8} paddingInlineStart={12}>
			<Box>{t(title)}</Box>
		</Box>
	);
};
