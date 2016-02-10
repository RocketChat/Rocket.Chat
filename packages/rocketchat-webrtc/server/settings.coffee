RocketChat.settings.addGroup 'WebRTC'
RocketChat.settings.add 'WebRTC_Enable_Channel', false, { type: 'boolean', group: 'WebRTC', public: true, i18nLabel: 'WebRTC_Enable_Channel'}
RocketChat.settings.add 'WebRTC_Enable_Private', true , { type: 'boolean', group: 'WebRTC', public: true, i18nLabel: 'WebRTC_Enable_Private'}
RocketChat.settings.add 'WebRTC_Enable_Direct' , true , { type: 'boolean', group: 'WebRTC', public: true, i18nLabel: 'WebRTC_Enable_Direct'}
RocketChat.settings.add 'WebRTC_STUN_Server', 'stun:stun.l.google.com:19302', { type: 'string', group: 'WebRTC', public: true, i18nLabel: 'WebRTC_STUN_Server'}
RocketChat.settings.add 'WebRTC_TURN_Server', 'turn:numb.viagenie.ca:3478', { type: 'string', group: 'WebRTC', public: true, i18nLabel: 'WebRTC_TURN_Server'}
RocketChat.settings.add 'WebRTC_TURN_Username', 'team@rocket.chat', { type: 'string', group: 'WebRTC', public: true, i18nLabel: 'WebRTC_TURN_Username'}
RocketChat.settings.add 'WebRTC_TURN_Password', 'demo', { type: 'string', group: 'WebRTC', public: true, i18nLabel: 'WebRTC_TURN_Password'}
