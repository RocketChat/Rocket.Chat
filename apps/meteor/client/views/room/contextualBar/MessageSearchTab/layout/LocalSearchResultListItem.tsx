import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

/** One hit of the local search list, with the day divider above it when the day changes. */
const LocalSearchResultListItem = ({ children }: { children: ReactNode }) => <Box is='li'>{children}</Box>;

export default LocalSearchResultListItem;
