import { Box, IconButton } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type HeaderProps = {
	children?: ReactNode;
	title?: ReactNode;
	onClose?: () => void;
};

const Header = ({ title, onClose, children, ...props }: HeaderProps) => {
	const { t } = useTranslation();

	return (
		<Box display='flex' flexDirection='column' paddingBlock={16} {...props}>
			{(title || onClose) && (
				<Box display='flex' flexDirection='row' alignItems='center' paddingInline={24} justifyContent='space-between' flexGrow={1}>
					{title && (
						<Box color='default' fontScale='p2b' flexShrink={1} withTruncatedText>
							{title}
						</Box>
					)}
					{onClose && <IconButton small aria-label={t('Close')} icon='cross' onClick={onClose} />}
				</Box>
			)}
			{children}
		</Box>
	);
};

export default Header;
