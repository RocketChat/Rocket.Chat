import { Box, Card, CardTitle, CardBody, Icon, Palette } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

const PlanCardBase = ({ name, children }: { name: string; children: ReactNode }): ReactElement => {
	return (
		<Card height='full'>
			<CardTitle>
				<Icon name='rocketchat' color={Palette.badge['badge-background-level-4'].toString()} size={28} mie={4} />
				<Box fontScale='h3'>{name}</Box>
			</CardTitle>
			<CardBody>
				<div>{children}</div>
			</CardBody>
		</Card>
	);
};

export default PlanCardBase;
