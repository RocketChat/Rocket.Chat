import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type LocalSearchResultListItemProps = { children: ReactNode };

const LocalSearchResultListItem = ({ children }: LocalSearchResultListItemProps) => <Box is='li'>{children}</Box>;

export default LocalSearchResultListItem;
