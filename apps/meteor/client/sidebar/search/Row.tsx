import { IRoom, ISubscription } from '@rocket.chat/core-typings';
import React, { memo, ReactElement } from 'react';

import SideBarItemTemplateWithData from '../RoomList/SideBarItemTemplateWithData';
import UserItem from './UserItem';

type RowProps = {
	item: ISubscription & IRoom;
	data: Record<string, any>;
};

const Row = ({ item, data }: RowProps): ReactElement => {
	const { t, SideBarItemTemplate, avatarTemplate: AvatarTemplate, useRealName, extended } = data;

	if (item.t === 'd' && !item.u) {
		return (
			<UserItem
				id={`search-${item._id}`}
				useRealName={useRealName}
				t={t}
				item={item}
				SideBarItemTemplate={SideBarItemTemplate}
				AvatarTemplate={AvatarTemplate}
			/>
		);
	}
	return (
		<SideBarItemTemplateWithData
			id={`search-${item._id}`}
			extended={extended}
			t={t}
			room={item}
			SideBarItemTemplate={SideBarItemTemplate}
			AvatarTemplate={AvatarTemplate}
		/>
	);
};

export default memo(Row);

// data
// SideBarItemTemplate: {$$typeof: Symbol(react.memo), compare: null, type: ƒ}
// avatarTemplate: room => {…}
// extended: false
// items: (5) [{…}, {…}, {…}, {…}, {…}]
// sidebarViewMode: "medium"
// t: ƒ (key)
// useRealName: false

// item
// alert: false
// announcement: undefined
// archived: undefined
// avatarETag: undefined
// bridged: undefined
// broadcast: undefined
// cl: undefined
// closedAt: undefined
// departmentId: undefined
// description: undefined
// encrypted: undefined
// fname: "Rocket.Cat"
// groupMentions: 0
// jitsiTimeout: undefined
// lastMessage: {_id: '89dkpqMKccfdSoYwu', rid: 'R3XXz9ju5t3W8eNberocket.cat', msg: 'sadfasdfs', ts: Mon May 23 2022 15:29:52 GMT-0300 (Brasilia Standard Time), u: {…}, …}
// livechatData: undefined
// lm: Mon May 23 2022 15:29:52 GMT-0300 (Brasilia Standard Time) {}
// lowerCaseFName: "rocket.cat"
// lowerCaseName: "rocket.cat"
// ls: Mon May 23 2022 15:30:05 GMT-0300 (Brasilia Standard Time) {}
// metrics: undefined
// muted: undefined
// name: "rocket.cat"
// onHold: undefined
// open: true
// priorityId: undefined
// queuedAt: undefined
// responseBy: undefined
// retention: undefined
// rid: "R3XXz9ju5t3W8eNberocket.cat"
// servedBy: undefined
// source: undefined
// streamingOptions: undefined
// t: "d"
// tags: undefined
// teamId: undefined
// teamMain: undefined
// topic: undefined
// transcriptRequest: undefined
// ts: Fri May 20 2022 15:34:09 GMT-0300 (Brasilia Standard Time) {}
// u:
// username: "julia.foresti"
// _id: "R3XXz9ju5t3W8eNbe"
// [[Prototype]]: Object
// uids: (2) ['R3XXz9ju5t3W8eNbe', 'rocket.cat']
// unread: 0
// userMentions: 0
// usernames: (2) ['julia.foresti', 'rocket.cat']
// v: undefined
// waitingResponse: undefined
// _id: "7GgZgXuWX5zxEa2Ct"
// _updatedAt: Mon May 23 2022 15
