Meteor.methods
    webcRequest: (rid) ->
        server = RocketChat.settings.get('Webc_Server')
        domain = RocketChat.settings.get('Webc_Domain')

        user = RocketChat.models.Users.findOneById Meteor.userId()

        room = Meteor.call 'canAccessRoom', rid, user._id
        if not room
            return false

        to_notify = RocketChat.models.Users.findUsersByUsernames(room.usernames).fetch()
        emails = []
        for recipient in to_notify
            if recipient.emails
                emails.push(recipient.emails[0].address)
        console.log "will notify #{emails}"

        console.log("will call server " + server + " on behalf of " + user.username)

        loginUrl = server + "/trustedauth/login"
        apiUrl = server + "/jsondata/extjs/bbbHandler/create_live_bbb_json"

        data =
            username: user.username + "@" + domain,
            domain: domain

        opts =
            params: data

        try
            result = HTTP.call 'POST', loginUrl, opts
            console.log result

            if not result?
                throw new Meteor.Error('error-webc-noresult',
                    "No result", { method: 'webcRequest' })

            if result.statusCode not in [200, 201, 202]
                throw new Meteor.Error('error-webc-invalid-response',
                    "Invalid response " + result.statusCode, { method: 'webcRequest' })

            if result?.statusCode in [200, 201, 202]
                token = result.data.token

                apires = HTTP.call 'POST', apiUrl,
                    params:
                        token: token
                        data: JSON.stringify [{'attendees': emails}]

                if apires.statusCode in [200, 201, 202] and apires.content
                    console.log apires
                    values = JSON.parse apires.content
                    for k,v of values
                        if k == "meeting_uuid"
                            continue

                        console.log k + ": " + v

                        recipient = RocketChat.models.Users.findOneByEmailAddress k

                        if not recipient?
                            continue

                        if recipient._id == Meteor.userId()
                            body = "Hai richiesto una sessione di collaboration " + v
                        else
                            body = user.username + " ha richiesto una sessione di collaboration " + v

                        msg = {
                            _id: Random.id()
                            rid: room._id
                            ts: new Date
                            msg: body
                        }
                        RocketChat.Notifications.notifyUser recipient._id, 'webconf', msg

                return token

        catch e
            console.log e
            if e instanceof Meteor.Error
                throw e
            if e.response?
                throw new Meteor.Error('error-webc-http', e.response.statusCode)
            else
                throw new Meteor.Error('error-webc-generic', "Unhandled Error")

