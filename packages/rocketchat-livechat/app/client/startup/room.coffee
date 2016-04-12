msgStream = new Meteor.Streamer 'messages'
Tracker.autorun ->
	if visitor.getRoom()?
		msgStream.on visitor.getRoom(), (msg) ->
			if msg.t is 'command'
				if msg.msg is 'survey'
					unless $('body #survey').length
						Blaze.render(Template.survey, $('body').get(0))
			else
				ChatMessage.upsert { _id: msg._id }, msg
