import type { Card } from '@rocket.chat/fuselage';
import { useTranslation, useSetModal } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';

import { GenericCard, GenericCardButton } from '../../../components/GenericCard';
import CreateChannelModal from '../../../navbar/NavBarPagesGroup/actions/CreateChannelModal';

export type CreateChannelsCardProps = Omit<ComponentProps<typeof Card>, 'type'>;

const CreateChannelsCard = (props: CreateChannelsCardProps) => {
	const t = useTranslation();
	const setModal = useSetModal();

	const openCreateChannelModal = (): void => setModal(<CreateChannelModal onClose={(): void => setModal(null)} />);

	return (
		<GenericCard
			title={t('Create_channels')}
			body={t('Create_a_public_channel_that_new_workspace_members_can_join')}
			buttons={[
				<GenericCardButton key={1} onClick={openCreateChannelModal}>
					{t('Create_channel')}
				</GenericCardButton>,
			]}
			width='x340'
			{...props}
		/>
	);
};

export default CreateChannelsCard;
