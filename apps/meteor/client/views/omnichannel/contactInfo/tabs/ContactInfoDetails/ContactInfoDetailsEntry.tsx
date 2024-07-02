import { Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useIsCallReady } from '../../../../../contexts/CallContext';
import useClipboardWithToast from '../../../../../hooks/useClipboardWithToast';
import IdentityVerificationModal from '../../IdentityVerificationModal';
import ContactInfoCallButton from './ContactInfoCallButton';

type ContactInfoDetailsEntryProps = {
	type: 'phone' | 'email';
	label: string;
	value: string;
};

const ContactInfoDetailsEntry = ({ type, label, value }: ContactInfoDetailsEntryProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const { copy } = useClipboardWithToast(value);

	const isCallReady = useIsCallReady();

	const handleOpenModal = () => setModal(<IdentityVerificationModal onCancel={() => setModal(null)} />);

	return (
		<Box>
			<Box fontScale='p2'>{label}</Box>
			<Box display='flex' alignItems='center'>
				<Icon size='x18' name={type === 'phone' ? 'phone' : 'mail'} />
				<Box mi={4} fontScale='p2'>
					{value}
				</Box>
				<Box display='flex' flexGrow={1} justifyContent='space-between'>
					<IconButton onClick={handleOpenModal} tiny icon='circle-cross' />
					<Box display='flex' alignItems='center'>
						{isCallReady && <ContactInfoCallButton phoneNumber={value} />}
						<IconButton onClick={() => copy()} tiny title={t('Copy')} icon='copy' />
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default ContactInfoDetailsEntry;
