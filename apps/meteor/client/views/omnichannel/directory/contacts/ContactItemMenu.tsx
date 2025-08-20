import type { ILivechatContactChannel } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useRouter, useSetModal, usePermission } from '@rocket.chat/ui-contexts';
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

	const canEditContact = usePermission('update-livechat-contact');
	const canDeleteContact = usePermission('delete-livechat-contact');

	const handleContactEdit = useEffectEvent((): void =>
		router.navigate({
			pattern: '/omnichannel-directory/:tab?/:context?/:id?',
			params: {
				tab: 'contacts',
				context: 'edit',
				id: _id,
			},
		}),
	);

	const handleContactRemoval = useEffectEvent(() => {
		setModal(<RemoveContactModal _id={_id} name={name} channelsCount={channels.length} onClose={() => setModal(null)} />);
	});

	const menuOptions: GenericMenuItemProps[] = [
		{
			id: 'edit',
			icon: 'edit',
			content: t('edit'),
			onClick: () => handleContactEdit(),
			disabled: !canEditContact,
		},
		{
			id: 'delete',
			icon: 'trash',
			content: t('Delete'),
			onClick: () => handleContactRemoval(),
			variant: 'danger',
			disabled: !canDeleteContact,
		},
	];

	return <GenericMenu detached title={t('More_actions')} sections={[{ title: '', items: menuOptions }]} placement='bottom-end' />;
};

export default ContactItemMenu;
