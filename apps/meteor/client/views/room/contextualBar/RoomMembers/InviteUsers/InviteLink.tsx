import { Field, FieldHint, FieldLabel, FieldRow, UrlInput, Icon, Button, ButtonGroup, InputBoxSkeleton } from '@rocket.chat/fuselage';
import { useClipboardWithToast } from '@rocket.chat/ui-client';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

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
						<UrlInput
							id={inviteLinkId}
							value={linkText}
							aria-describedby={captionText ? `${inviteLinkId}-hint` : undefined}
							endAddon={<Icon onClick={(): Promise<void> => copy()} name='copy' size='x16' />}
						/>
					)}
				</FieldRow>
				{captionText && <FieldHint id={`${inviteLinkId}-hint`}>{captionText}</FieldHint>}
			</Field>
			{onClickEdit && (
				<ButtonGroup>
					<Button onClick={onClickEdit}>{t('Edit_Invite')}</Button>
				</ButtonGroup>
			)}
		</>
	);
};

export default InviteLink;
