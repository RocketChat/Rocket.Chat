import { useContext } from 'react';

import { MeteorContext } from '../components/contexts/MeteorContext';

export const useMeteor = () => useContext(MeteorContext).Meteor;
