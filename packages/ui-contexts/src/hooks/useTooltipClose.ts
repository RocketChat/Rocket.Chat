import { useContext } from 'react';

import type { TooltipContextValue } from '../TooltipContext.js';
import { TooltipContext } from '../TooltipContext.js';

export const useTooltipClose = (): TooltipContextValue['close'] => useContext(TooltipContext).close;
