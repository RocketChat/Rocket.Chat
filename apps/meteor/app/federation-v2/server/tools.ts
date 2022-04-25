import { settings } from '../../settings/server';
import { matrixBridge } from './bridge';

export const isFederationMatrixEnabled = (): boolean => !!(settings.get('Federation_Matrix_enabled') && matrixBridge);
