import { useContext } from 'react';

import { TooltipContext, TooltipContextValue } from '../TooltipContext';

export const useTooltipOpen = (): TooltipContextValue['open'] => useContext(TooltipContext).open;
