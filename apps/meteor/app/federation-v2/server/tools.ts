import { settings } from '../../settings/server';
import { matrixBridge } from './bridge';

export const isFederation_MatrixEnabled = () => settings.get('Federation_Matrix_enabled') && matrixBridge;
