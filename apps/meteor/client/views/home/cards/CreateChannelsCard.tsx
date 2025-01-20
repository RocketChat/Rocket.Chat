import type { Card } from '@rocket.chat/fuselage';
import { useTranslation, useSetModal } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';

import { GenericCard, GenericCardButton } from '../../../components/GenericCard';
import CreateChannelWithData from '../../../sidebar/header/CreateChannel';

const CreateChannelsCard = (props: Omit<ComponentProps<typeof Card>, 'type'>): ReactElement => {
	const t = useTranslation();
	const setModal = useSetModal();

	const openCreateChannelModal = (): void => setModal(<CreateChannelWithData onClose={(): void => setModal(null)} />);

	return (
		<GenericCard
			title={t('Create_channels')}
			body={t('Create_a_public_channel_that_new_workspace_members_can_join')}
			buttons={[<GenericCardButton key={1} onClick={openCreateChannelModal} children={t('Create_channel')} />]}
			data-qa-id='homepage-create-channels-card'
			width='x340'
			{...props}
		/>
	);
};

export default CreateChannelsCard;
