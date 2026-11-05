import { useContext } from 'react';

import type { TooltipContextValue } from '../TooltipContext.js';
import { TooltipContext } from '../TooltipContext.js';

export const useTooltipOpen = (): TooltipContextValue['open'] => useContext(TooltipContext).open;
