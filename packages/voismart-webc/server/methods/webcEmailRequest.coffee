Meteor.methods
    webcGetEmails: (rid) ->
        server = RocketChat.settings.get('Webc_Server')
        domain = RocketChat.settings.get('Webc_Domain')
        user = RocketChat.models.Users.findOneById Meteor.userId()
        room = Meteor.call 'canAccessRoom', rid, user._id
        if not room
            return []
        to_notify = RocketChat.models.Users.findUsersByUsernames(room.usernames).fetch()
        emails = []
        for recipient in to_notify
            if recipient.emails
                emails.push(recipient.emails[0].address)
        console.log "will notify #{emails}"
        return emails

    webcByEmailRequest: (rid, attendees, start_ts, duration, public_number) ->
        domain = RocketChat.settings.get('OrchestraIntegration_Domain')
        user = RocketChat.models.Users.findOneById Meteor.userId()
        username = user.username + "@" + domain
        room = Meteor.call 'canAccessRoom', rid, user._id
        if not room
            return false
        ng = new NGApiAuto(username, RocketChat.settings.get('OrchestraIntegration_Server'))
        try
            results = ng.create_live_bbb(attendees, start_ts, duration, public_number)
        catch e
            if e instanceof Meteor.Error
                throw e
            if e.response?
                throw new Meteor.Error('error-webc-http', e.response.statusCode)
            else
                throw new Meteor.Error('error-webcemail-generic', "Unhandled Error")

