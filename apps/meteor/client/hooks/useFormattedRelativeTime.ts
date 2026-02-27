import { formatDurationMs } from '../lib/utils/dateFormat';
import { useMemo } from 'react';

export const useFormattedRelativeTime = (timeMs: number): string => useMemo(() => formatDurationMs(timeMs), [timeMs]);
