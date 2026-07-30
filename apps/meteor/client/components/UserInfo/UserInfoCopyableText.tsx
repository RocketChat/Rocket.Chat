import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { InfoPanelText } from '@rocket.chat/ui-client';
import type { ComponentProps, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import useClipboardWithToast from '../../hooks/useClipboardWithToast';

const revealOnHoverStyle = css`
	& .rcx-user-info-copy {
		opacity: 0;
	}

	&:hover .rcx-user-info-copy,
	&:focus-within .rcx-user-info-copy {
		opacity: 1;
	}
`;

type UserInfoCopyableTextProps = {
	text: string;
	children?: ReactNode;
} & ComponentProps<typeof InfoPanelText>;

const UserInfoCopyableText = ({ text, children, ...props }: UserInfoCopyableTextProps) => {
	const { t } = useTranslation();
	const { copy } = useClipboardWithToast(text);

	return (
		<InfoPanelText display='flex' flexDirection='row' alignItems='center' className={revealOnHoverStyle} {...props}>
			<Box flexShrink={1} withTruncatedText={props.withTruncatedText ?? true}>
				{children ?? text}
			</Box>
			<IconButton className='rcx-user-info-copy' mini icon='copy' title={t('Copy')} aria-label={t('Copy')} onClick={() => copy()} />
		</InfoPanelText>
	);
};

export default UserInfoCopyableText;
