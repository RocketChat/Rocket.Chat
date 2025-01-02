import type { App } from '@rocket.chat/core-typings';

export const filterAppsByEnterprise = ({ isEnterpriseOnly }: Partial<App>): boolean => Boolean(isEnterpriseOnly);
