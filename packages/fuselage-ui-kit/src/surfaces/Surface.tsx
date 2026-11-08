import { Box } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import type { ContextType, ReactNode } from 'react';

import { MentionBudgetContext, createMentionBudget } from '../contexts/MentionBudgetContext';
import { SurfaceContext } from '../contexts/SurfaceContext';

export type SurfaceProps = {
	children: ReactNode;
	type: ContextType<typeof SurfaceContext>;
};

export const Surface = ({ children, type }: SurfaceProps) => {
	// A new view brings new mentions, which must not stay unresolved because the ones it replaced used up the budget.
	const mentionBudget = useMemo(createMentionBudget, [children]);

	return (
		<SurfaceContext.Provider value={type}>
			<MentionBudgetContext.Provider value={mentionBudget}>
				<Box
					display='flex'
					flexDirection='column'
					gap={type === 'message' ? 'x8' : 'x16'}
					paddingBlockEnd={type === 'message' ? 'x16' : undefined}
				>
					{children}
				</Box>
			</MentionBudgetContext.Provider>
		</SurfaceContext.Provider>
	);
};
