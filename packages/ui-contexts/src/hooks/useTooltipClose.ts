import { useContext } from 'react';

import { TooltipContext, TooltipContextValue } from '../TooltipContext';

export const useTooltipClose = (): TooltipContextValue['close'] => useContext(TooltipContext).close;
