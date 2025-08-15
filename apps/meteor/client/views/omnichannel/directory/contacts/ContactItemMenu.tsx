import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import RemoveContactModal from './RemoveContactModal';

type ContactItemMenuProps = {
	_id: string;
	name: string;
};

const ContactItemMenu = ({ _id, name }: ContactItemMenuProps): ReactElement => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	const handleContactRemoval = useEffectEvent(() => {
		setModal(<RemoveContactModal _id={_id} name={name} onClose={() => setModal(null)} />);
	});

	const menuOptions = {
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
