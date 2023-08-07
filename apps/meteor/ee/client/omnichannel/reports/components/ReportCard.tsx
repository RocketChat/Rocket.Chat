import { Box } from '@rocket.chat/fuselage';
import { Card } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import React from 'react';

import { CardErrorBoundary } from './CardErrorBoundary';

type ReportCardProps = {
	title: string;
	children: ReactNode;
	onFilter: (filters: any) => void;
};

export const ReportCard = ({ title, children, onFilter }: ReportCardProps) => {
	return (
		<Card>
			<Card.Title>{title}</Card.Title>
			<Card.Body>
				<Card.Col>
					<CardErrorBoundary>{children}</CardErrorBoundary>
				</Card.Col>
			</Card.Body>
		</Card>
	);
};
