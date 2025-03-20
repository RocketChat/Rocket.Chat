import type { App } from '../types';

export const filterAppsByEnterprise = ({ isEnterpriseOnly }: Partial<App>): boolean => Boolean(isEnterpriseOnly);
