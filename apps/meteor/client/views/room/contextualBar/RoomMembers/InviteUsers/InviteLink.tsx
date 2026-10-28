import { Field, FieldLabel, FieldRow, UrlInput, Icon, Button, InputBoxSkeleton } from '@rocket.chat/fuselage';
import { useClipboardWithToast } from '@rocket.chat/ui-client';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import InviteLinkAction from './layout/InviteLinkAction';
import InviteLinkCaption from './layout/InviteLinkCaption';

export type InviteLinkProps = {
	linkText: string;
	captionText: string;
	onClickEdit: () => void;
};

const InviteLink = ({ linkText, captionText, onClickEdit }: InviteLinkProps) => {
	const { t } = useTranslation();
	const { copy } = useClipboardWithToast(linkText);
	const inviteLinkId = useId();

	return (
		<>
			<Field>
				<FieldLabel htmlFor={inviteLinkId}>{t('Invite_Link')}</FieldLabel>
				<FieldRow>
					{!linkText && <InputBoxSkeleton />}
					{linkText && (
						<UrlInput id={inviteLinkId} value={linkText} endAddon={<Icon onClick={(): Promise<void> => copy()} name='copy' size='x16' />} />
					)}
				</FieldRow>
				{captionText && <InviteLinkCaption>{captionText}</InviteLinkCaption>}
			</Field>
			{onClickEdit && (
				<InviteLinkAction>
					<Button onClick={onClickEdit}>{t('Edit_Invite')}</Button>
				</InviteLinkAction>
			)}
		</>
	);
};

export default InviteLink;
