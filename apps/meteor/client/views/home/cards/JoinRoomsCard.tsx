import type { Card } from '@rocket.chat/fuselage';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';

import { useHomeCardClassName } from './useHomeCardClassName';
import { GenericCard, GenericCardButton } from '../../../components/GenericCard';

const JoinRoomsCard = ({ className, ...props }: Omit<ComponentProps<typeof Card>, 'type'>) => {
	const homeCardClassName = useHomeCardClassName(className);
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
			className={homeCardClassName}
			{...props}
		/>
	);
};

export default JoinRoomsCard;
