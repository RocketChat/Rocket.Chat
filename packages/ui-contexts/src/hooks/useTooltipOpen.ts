import { useContext } from 'react';

import type { TooltipContextValue } from '../TooltipContext';
import { TooltipContext } from '../TooltipContext';

export const useTooltipOpen = (): TooltipContextValue['open'] => useContext(TooltipContext).open;
