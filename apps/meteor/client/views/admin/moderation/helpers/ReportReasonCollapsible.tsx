import { Box, Button } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';
import type { ReactNode } from 'react';

const ReportReasonCollapsible = ({ children }: { children: ReactNode }) => {
	const [isOpen, setIsOpen] = useState(false);
	const t = useTranslation();

	const toggle = () => setIsOpen((prev) => !prev);

	return (
		<>
			<Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
				<Button small onClick={toggle} aria-expanded={isOpen} aria-controls='report-reasons'>
					{isOpen ? t('Moderation_Hide_reports') : t('Moderation_Show_reports')}
				</Button>
			</Box>
			{isOpen && children}
		</>
	);
};

export default ReportReasonCollapsible;
