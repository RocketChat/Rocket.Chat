import type { CallDiagnosticsData } from '@rocket.chat/ui-voip';
import { createContext, useContext } from 'react';

const CallDiagnosticsContext = createContext<CallDiagnosticsData | undefined>(undefined);

export const useCallDiagnosticsContext = (): CallDiagnosticsData | undefined => useContext(CallDiagnosticsContext);

export default CallDiagnosticsContext;
