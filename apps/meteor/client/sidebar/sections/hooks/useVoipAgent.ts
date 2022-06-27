import { useContext } from 'react';

import { VoIPAgentContext, VoIPAgentContextValue } from '../../../contexts/VoIPAgentContext';

export const useVoipAgent = (): VoIPAgentContextValue => useContext(VoIPAgentContext);
