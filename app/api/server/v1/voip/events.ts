import { Match, check } from 'meteor/check';

import { API } from '../../api';
import { LivechatVoip } from '../../../../../server/sdk';
import { canAccessRoom } from '../../../../authorization/server';
import { VoipRoom } from '../../../../models/server/raw';
import { VoipClientEvents } from '../../../../../definition/voip/VoipClientEvents';

API.v1.addRoute(
	'voip/events',
	{ authRequired: true },
	{
		async post() {
			check(this.requestParams(), {
				event: Match.Where((v: string) => {
					return Object.values<string>(VoipClientEvents).includes(v);
				}),
				rid: String,
				comment: Match.Maybe(String),
			});

			const { rid, event, comment } = this.requestParams();

			const room = await VoipRoom.findOneVoipRoomById(rid);
			if (!room) {
				return API.v1.notFound();
			}
			if (!canAccessRoom(room, this.user)) {
				return API.v1.unauthorized();
			}

			return API.v1.success(await LivechatVoip.handleEvent(event, room, this.user, comment));
		},
	},
);
