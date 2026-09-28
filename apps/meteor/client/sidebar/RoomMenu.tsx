import type { RoomType } from '@rocket.chat/core-typings';
import { GenericMenu } from '@rocket.chat/ui-client';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import CategoryRoomMenu from './categories/CategoryRoomMenu';
import { useHasLicenseModule } from '../hooks/useHasLicenseModule';
import { useRoomMenuActions } from '../hooks/useRoomMenuActions';

export type RoomMenuProps = {
	rid: string;
	unread?: boolean;
	threadUnread?: boolean;
	alert?: boolean;
	roomOpen?: boolean;
	type: RoomType;
	cl?: boolean;
	name?: string;
	hideDefaultOptions: boolean;
};

const RoomMenu = ({ rid, unread, threadUnread, alert, roomOpen, type, cl, name = '', hideDefaultOptions = false }: RoomMenuProps) => {
	const { t } = useTranslation();
	const { data: hasLicenseModule = false } = useHasLicenseModule('experimental-enterprise-features');

	const isUnread = alert || unread || threadUnread;
	const sections = useRoomMenuActions({ rid, type, name, isUnread, cl, roomOpen, hideDefaultOptions });

	if (hasLicenseModule && !hideDefaultOptions && type !== 'l') {
		return <CategoryRoomMenu rid={rid} name={name} sections={sections} />;
	}

	return <GenericMenu detached title={t('Options')} mini aria-keyshortcuts='alt' sections={sections} />;
};

export default memo(RoomMenu);
