import type { Card } from '@rocket.chat/fuselage';
import { useTranslation, useSetModal } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';

import { useHomeCardClassName } from './useHomeCardClassName';
import { GenericCard, GenericCardButton } from '../../../components/GenericCard';
import CreateChannelModal from '../../../navbar/NavBarPagesGroup/actions/CreateChannelModalWithData';

const CreateChannelsCard = ({ className, ...props }: Omit<ComponentProps<typeof Card>, 'type'>) => {
	const homeCardClassName = useHomeCardClassName(className);
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
			className={homeCardClassName}
			{...props}
		/>
	);
};

export default CreateChannelsCard;
