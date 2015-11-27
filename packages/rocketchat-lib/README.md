## Rocket.Chat main library

This package contains the main libraries of Rocket.Chat.

### APIs

#### roomTypes

You can create your own room type using (on the client):

```javascript
RocketChat.roomTypes.add('l', 5, {
    template: 'livechat',
    icon: 'icon-chat-empty',
    route: {
        name: 'live',
        path: '/live/:name',
        action(params, queryParams) {
            Session.set('showUserInfo');
            openRoom('l', params.name);
        },
        link(sub)  {
            return { name: sub.name }
        }
    },
    permissions: [ 'view-l-room' ]
});
```

You'll need publish information about the new room with (on the server):

```javascript
RocketChat.roomTypes.setPublish('l', (identifier) => {
    return RocketChat.models.Rooms.findByTypeAndName('l', identifier, {
        fields: {
            name: 1,
            t: 1,
            cl: 1,
            u: 1,
            usernames: 1,
            v: 1
        }
    });
});
```

### AccountBox

You can add items to the left upper corner drop menu:
```javascript
AccountBox.addItem({
    name: 'Livechat',
    icon: 'icon-chat-empty',
    class: 'livechat-manager',
    route: {
        name: 'livechat-manager',
        path: '/livechat-manager',
        action(params, queryParams) {
            Session.set('openedRoom');
            BlazeLayout.render('main', {
                center: 'page-container',
                pageTitle: 'Live Chat Manager',
                pageTemplate: 'livechat-manager'
            });
        }
    },
    permissions: ['view-livechat-manager']
});
```

### Functions
### Methods
### Publications
