import { Box, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC, ReactNode } from 'react';
import React from 'react';

type HeaderProps = {
	title?: ReactNode;
	onClose?: () => void;
};

const Header: FC<HeaderProps> = ({ title, onClose, children, ...props }) => {
	const t = useTranslation();

	return (
		<Box is='header' display='flex' flexDirection='column' pb={16} {...props}>
			{(title || onClose) && (
				<Box display='flex' flexDirection='row' alignItems='center' pi={24} justifyContent='space-between' flexGrow={1}>
					{title && (
						<Box color='default' fontScale='p2' flexShrink={1} withTruncatedText>
							{title}
						</Box>
					)}
					{onClose && <IconButton aria-label={t('Close')} title={t('Close')} small icon='cross' onClick={onClose} />}
				</Box>
			)}
			{children}
		</Box>
	);
};

export default Header;
