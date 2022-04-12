import { settings } from '../../settings/server';
import { matrixBridge } from './bridge';

export const isFederationV2Enabled = () => settings.get('FederationV2_enabled') && matrixBridge;
