import type { IUIActionButton, IUActionButtonWhen } from '@rocket.chat/apps-engine/definition/ui/IUIActionButtonDescriptor';
import type { UserStatus } from '@rocket.chat/core-typings';
import type { TranslationKey, LocationPathname } from '@rocket.chat/ui-contexts';
import type { Icon } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import { sdk } from '../../../utils/client/lib/SDKClient';

export interface IAppAccountBoxItem extends IUIActionButton {
	name: string;
	icon?: string;
	href?: string;
	sideNav?: string;
	isAppButtonItem?: boolean;
	subItems?: [IAppAccountBoxItem];
	when?: Omit<IUActionButtonWhen, 'roomTypes' | 'messageActionContext'>;
}

export type AccountBoxItem = {
	name: TranslationKey;
	icon: ComponentProps<typeof Icon>['name'];
	href: LocationPathname;
	sideNav?: string;
	condition: () => boolean;
};

export const isAppAccountBoxItem = (item: IAppAccountBoxItem | AccountBoxItem): item is IAppAccountBoxItem => 'isAppButtonItem' in item;

class AccountBoxBase {
	public setStatus(status: UserStatus, statusText?: string): any {
		return sdk.rest.post('/v1/users.setStatus', { status, message: statusText });
	}
}

export const AccountBox = new AccountBoxBase();
