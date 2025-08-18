import type { ILivechatContactChannel } from '@rocket.chat/core-typings';
import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import RemoveContactModal from './RemoveContactModal';

type ContactItemMenuProps = {
	_id: string;
	name: string;
	channels: ILivechatContactChannel[];
};

const ContactItemMenu = ({ _id, name, channels }: ContactItemMenuProps): ReactElement => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const router = useRouter();

	const handleContactEdit = useEffectEvent((): void => router.navigate(`/omnichannel-directory/contacts/edit/${_id}`));
	const handleContactRemoval = useEffectEvent(() => {
		setModal(<RemoveContactModal _id={_id} name={name} channelsCount={channels.length} onClose={() => setModal(null)} />);
	});

	const menuOptions = {
		edit: {
			label: (
				<Box>
					<Icon name='edit' size='x16' mie={4} />
					{t('Edit')}
				</Box>
			),
			action: (): void => handleContactEdit(),
		},
		delete: {
			label: (
				<Box>
					<Icon name='trash' size='x16' mie={4} />
					{t('Delete')}
				</Box>
			),
			action: (): void => handleContactRemoval(),
		},
	};

	return <Menu options={menuOptions} />;
};

export default ContactItemMenu;
