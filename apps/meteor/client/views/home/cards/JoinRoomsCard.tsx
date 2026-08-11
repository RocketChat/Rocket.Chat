import type { CardProps } from '@rocket.chat/fuselage';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';

import { GenericCard, GenericCardButton } from '../../../components/GenericCard';

export type JoinRoomsCardProps = Omit<CardProps, 'type'>;

const JoinRoomsCard = (props: JoinRoomsCardProps) => {
	const t = useTranslation();

	const router = useRouter();
	const handleDirectory = (): void => {
		router.navigate('/directory');
	};

	return (
		<GenericCard
			title={t('Join_rooms')}
			body={t('Discover_public_channels_and_teams_in_the_workspace_directory')}
			buttons={[
				<GenericCardButton key={1} onClick={handleDirectory}>
					{t('Open_directory')}
				</GenericCardButton>,
			]}
			width='x340'
			{...props}
		/>
	);
};

export default JoinRoomsCard;
