import { App } from '../types';

export const filterAppsMarketplace = ({ marketplace }: App): boolean => marketplace !== false;
