Meteor.startup ->
    RocketChat.settings.addGroup 'Phone', ->
        @add 'Phone_Enabled', false, { type: 'boolean', public: true, group: 'Phone' }
        @add 'Phone_WSS', false, { type: 'string', public: true, group: 'Phone' }
        @add 'Phone_ICEServers', 'stun:stun.l.google.com:19302', { type: 'string', public: true, group: 'Phone' }
