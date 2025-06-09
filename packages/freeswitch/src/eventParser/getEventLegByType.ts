// import type { IFreeSwitchChannelEvent, IFreeSwitchChannelEventLeg } from '@rocket.chat/core-typings';

// export function getEventLegByType(event: IFreeSwitchChannelEvent, type: 'originator' | 'originatee'): Partial<IFreeSwitchChannelEventLeg> {
// 	const legs = Object.values(event.legs);
// 	const explicit = legs.find((leg) => leg.type === type);
// 	if (explicit) {
// 		return explicit;
// 	}

// 	const naturalType = 

// 	const otherType = type === 'originator' ? 'originatee' : 'originator';
// 	if (legs.some((leg) => leg.type === otherType)) {
// 		const mainLeg = legs.find((leg) => leg.type !== otherType);
// 	}

// 	switch (type) {
// 		case 'originator':

// 			break;
// 	}

// }
