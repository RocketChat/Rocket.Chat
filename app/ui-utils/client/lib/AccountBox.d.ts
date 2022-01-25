import type { ComponentProps } from 'react';
import { Option } from '@rocket.chat/fuselage';

import { IUser } from '../../../../definition/IUser';
import { TranslationKey } from '../../../../client/contexts/TranslationContext';

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
