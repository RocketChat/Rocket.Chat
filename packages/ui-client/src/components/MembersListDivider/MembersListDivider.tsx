import { Box } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

export type MembersListDividerProps = {
	title: TranslationKey;
	count: number;
};

/** Heads a group of people in a list, and says how many of them there are. */
export const MembersListDivider = ({ title, count }: MembersListDividerProps) => {
	const { t } = useTranslation();

	return (
		<Box
			key={title}
			backgroundColor='room'
			height={36}
			fontScale='p2m'
			color='defaut'
			paddingBlock={8}
			paddingInline={24}
			display='flex'
			flexDirection='row'
			justifyContent='space-between'
			borderBlockEndWidth='default'
			borderBlockEndColor='extra-light'
		>
			<Box>{t(title)}</Box>
			<Box>{count}</Box>
		</Box>
	);
};
