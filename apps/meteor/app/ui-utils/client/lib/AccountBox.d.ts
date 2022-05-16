import type { ComponentProps } from 'react';
import { Option } from '@rocket.chat/fuselage';
import type { IUser } from '@rocket.chat/core-typings';
import { TranslationKey } from '@rocket.chat/ui-contexts';

export declare const AccountBox: {
	setStatus: (status: IUser['status'], statusText?: IUser['statusText']) => void;
	getItems: () => Array<{
		condition: () => boolean;
		name: TranslationKey;
		icon: ComponentProps<typeof Option>['icon'];
		sideNav: string;
		href: string;
	}>;
};
