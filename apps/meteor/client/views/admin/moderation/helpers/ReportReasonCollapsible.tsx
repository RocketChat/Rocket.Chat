import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';
import type { ReactNode } from 'react';

const ReportReasonCollapsible = ({ children }: { children: ReactNode }) => {
	const [isOpen, setIsOpen] = useState(false);

	const t = useTranslation();

	const toggle = () => setIsOpen((prev) => !prev);

	return (
		<>
			<Box display='flex' flexDirection='row' justifyContent='space-between' is={'button'} alignItems='center' onClick={toggle}>
				<Box display='flex' flexDirection='row' alignItems='center'>
					<Box fontSize={'c1'} color={'font-info'}>
						{t('Moderation_Show_reports')}
					</Box>
					<Icon name={isOpen ? 'chevron-up' : 'chevron-down'} color={'font-info'} />
				</Box>
			</Box>
			{isOpen && children}
		</>
	);
};

export default ReportReasonCollapsible;
