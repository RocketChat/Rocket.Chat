import { useContext } from 'react';

import { MeteorContext } from '../components/contexts/MeteorContext';

export const useTracker = () => useContext(MeteorContext).Tracker;
