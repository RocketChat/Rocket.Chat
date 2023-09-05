import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useMentionsWithSymbol = (): ((mention: string | undefined) => string | undefined) => {
	const mentionsWithSymbol = useUserPreference<boolean>('mentionsWithSymbol') || false;

	return useMemo(() => (mention) => mentionsWithSymbol ? `@${mention}` : mention, [mentionsWithSymbol]);
};
