import { Box, Icon, Palette } from '@rocket.chat/fuselage';
import { Card, CardBody, CardColSection, CardTitle } from '@rocket.chat/ui-client';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

const PlanCardBase = ({ name, children }: { name: string; children: ReactNode }): ReactElement => {
	return (
		<Card>
			<CardTitle>
				<Icon name='rocketchat' color={Palette.badge['badge-background-level-4'].toString()} size={28} mie={4} />
				<Box fontScale='h3'>{name}</Box>
			</CardTitle>
			<CardBody>
				<CardColSection display='flex' flexDirection='column' h='full'>
					{children}
				</CardColSection>
			</CardBody>
		</Card>
	);
};

export default PlanCardBase;
