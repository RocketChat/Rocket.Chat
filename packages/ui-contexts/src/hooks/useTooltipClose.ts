import { useContext } from 'react';

import type { TooltipContextValue } from '../TooltipContext';
import { TooltipContext } from '../TooltipContext';

export const useTooltipClose = (): TooltipContextValue['close'] => useContext(TooltipContext).close;
