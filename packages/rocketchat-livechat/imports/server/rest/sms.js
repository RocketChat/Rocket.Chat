import LivechatVisitors from '../../../server/models/LivechatVisitors';

RocketChat.API.v1.addRoute('livechat/sms-incoming/:service', {
	post() {
		const SMSService = RocketChat.SMS.getService(this.urlParams.service);

		const sms = SMSService.parse(this.bodyParams);

		let visitor = LivechatVisitors.findOneVisitorByPhone(sms.from);

		const sendMessage = {
			message: {
				_id: Random.id()
			},
			roomInfo: {
				sms: {
					from: sms.to
				}
			}
		};

		if (visitor) {
			const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitor.token).fetch();

			if (rooms && rooms.length > 0) {
				sendMessage.message.rid = rooms[0]._id;
			} else {
				sendMessage.message.rid = Random.id();
			}
			sendMessage.message.token = visitor.token;
		} else {
			sendMessage.message.rid = Random.id();
			sendMessage.message.token = Random.id();

			const visitorId = RocketChat.Livechat.registerGuest({
				username: sms.from.replace(/[^0-9]/g, ''),
				token: sendMessage.message.token,
				phone: {
					number: sms.from
				}
			});

			visitor = LivechatVisitors.findOneById(visitorId);
		}

		sendMessage.message.msg = sms.body;
		sendMessage.guest = visitor;

		try {
			const message = SMSService.response.call(this, RocketChat.Livechat.sendMessage(sendMessage));

			Meteor.defer(() => {
				if (sms.extra) {
					if (sms.extra.fromCountry) {
						Meteor.call('livechat:setCustomField', sendMessage.message.token, 'country', sms.extra.fromCountry);
					}
					if (sms.extra.fromState) {
						Meteor.call('livechat:setCustomField', sendMessage.message.token, 'state', sms.extra.fromState);
					}
					if (sms.extra.fromCity) {
						Meteor.call('livechat:setCustomField', sendMessage.message.token, 'city', sms.extra.fromCity);
					}
				}
			});

			return message;
		} catch (e) {
			return SMSService.error.call(this, e);
		}
	}
});
