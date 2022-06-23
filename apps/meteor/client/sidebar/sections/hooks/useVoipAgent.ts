import { useContext } from 'react';

import { VoipAgentContext, VoipAgentContextValue } from '../../../contexts/VoipAgentContext';

export const useVoipAgent = (): VoipAgentContextValue => useContext(VoipAgentContext);
