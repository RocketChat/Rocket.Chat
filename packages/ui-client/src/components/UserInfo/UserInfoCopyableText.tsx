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
	/** Field name for the copy button's accessible name — a profile renders many "Copy" buttons, so each needs to say what it copies. */
	label?: string;
	children?: ReactNode;
} & ComponentProps<typeof InfoPanelText>;

const UserInfoCopyableText = ({ text, label, children, ...props }: UserInfoCopyableTextProps) => {
	const { t } = useTranslation();
	const { copy } = useClipboardWithToast(text);

	return (
		<InfoPanelText display='flex' flexDirection='row' alignItems='center' className={revealOnHoverStyle} {...props}>
			<Box display='flex' flexDirection='row' alignItems='center' flexShrink={1} withTruncatedText={props.withTruncatedText ?? true}>
				{children ?? text}
			</Box>
			<IconButton
				className='rcx-user-info-copy'
				marginInlineStart='x4'
				tiny
				icon='copy'
				title={label ? t('Copy_field', { field: label }) : t('Copy')}
				aria-label={label ? t('Copy_field', { field: label }) : t('Copy')}
				onClick={() => copy()}
			/>
		</InfoPanelText>
	);
};

export default UserInfoCopyableText;
