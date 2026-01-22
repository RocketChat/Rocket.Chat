import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import GenericCard from './GenericCard';

type StreamCardProps = {
	children: React.ReactNode;
	displayName: string;
	own?: boolean;
};

const StreamCard = ({ children, own, displayName }: StreamCardProps) => {
	const { t } = useTranslation();
	return (
		<GenericCard
			title={own ? t('Your_screen') : t('Peer__displayName__screen', { displayName })}
			slots={{
				bottomLeft: (
					<Box fontScale='p2b' color='default'>
						{displayName}
					</Box>
				),
			}}
		>
			{children}
		</GenericCard>
	);
};

export default StreamCard;
