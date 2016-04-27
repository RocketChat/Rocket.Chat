msgStream = new Meteor.Streamer 'room-messages'
Tracker.autorun ->
	if visitor.getRoomToSubscribe()?
		msgStream.on visitor.getRoomToSubscribe(), (msg) ->
			if msg.t is 'command'
				if msg.msg is 'survey'
					unless $('body #survey').length
						Blaze.render(Template.survey, $('body').get(0))
			else
				ChatMessage.upsert { _id: msg._id }, msg
