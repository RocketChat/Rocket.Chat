import { useMemo } from 'react';

import { formatDurationMs } from '../lib/utils/dateFormat';

export const useFormattedRelativeTime = (timeMs: number): string => useMemo(() => formatDurationMs(timeMs), [timeMs]);
