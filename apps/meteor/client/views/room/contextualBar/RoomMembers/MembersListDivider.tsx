import { Box } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

type MembersListDividerProps = {
	title: TranslationKey;
	count: number;
};

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
			borderBlockEndWidth={1}
			borderBlockEndColor='extra-light'
		>
			<Box>{t(title)}</Box>
			<Box>{count}</Box>
		</Box>
	);
};
