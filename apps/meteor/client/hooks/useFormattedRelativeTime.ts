import { formatDurationMs } from '@rocket.chat/ui-client';
import { useMemo } from 'react';

export const useFormattedRelativeTime = (timeMs: number): string => useMemo(() => formatDurationMs(timeMs), [timeMs]);
