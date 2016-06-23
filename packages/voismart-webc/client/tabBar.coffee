Meteor.startup ->
    enabled = RocketChat.settings.get('Webc_Enabled')
    if enabled is true
        RocketChat.TabBar.addButton({
            groups: ['channel', 'privategroup'],
            id: 'webcollaboration',
            i18nTitle: 'WebCollaboration',
            icon: 'icon-share',
            template: 'webCollaboration',
            order: 10
        })

    Tracker.autorun ->
        if Meteor.userId()
            RocketChat.Notifications.onUser 'webconf', (msg) ->
                msg.u =
                    username: 'ConferenceBot'
                msg.private = true
                ChatMessage.upsert { _id: msg._id }, msg

Template.webCollaboration.events
    'click #webc_tryme': (e, t) ->
        enabled = RocketChat.settings.get('Webc_Enabled')
        if enabled is false
            return

        Meteor.call 'webcRequest', Session.get('openedRoom'), (error, result) ->
            if not result?
                reason = "500"
                if error and error.reason
                    reason = error.reason
                msg = {
                    _id: Random.id()
                    rid: Session.get('openedRoom')
                    ts: new Date
                    u: username: 'ConferenceBot'
                    private: true
                    msg: "Error in WebCollabRequest (" + reason + ")"
                }
                ChatMessage.upsert { _id: msg._id }, msg
            else
                RocketChat.TabBar.closeFlex()

