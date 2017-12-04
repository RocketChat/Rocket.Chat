## Rocket.Chat main library

This package contains the main libraries of Rocket.Chat.

### APIs

#### Settings

This is an example to create settings:
```javascript
RocketChat.settings.addGroup('Settings_Group', function() {
    this.add('SettingInGroup', 'default_value', { type: 'boolean', public: true });

    this.section('Group_Section', function() {
        this.add('Setting_Inside_Section', 'default_value', {
            type: 'boolean',
            public: true,
            enableQuery: { 
                _id: 'SettingInGroup', 
                value: true 
            }
        });
    });
});
```

`RocketChat.settings.add` type:

* `string` - Stores a string value
    * Additional options:
        * `multiline`: boolean
* `int` - Stores an integer value
* `boolean` - Stores a boolean value
* `select` - Creates an `<select>` element
    * Additional options:
        * `values`: Array of: { key: 'value', i18nLabel: 'Option_Label' }
* `color` - Creates a color pick element
* `action` - Executes a `Method.call` to `value`
    * Additional options:
        * `actionText`: Translatable value of the button
* `asset` - Creates an upload field

`RocketChat.settings.add` options:

* `description` - Description of the setting
* `public` - Boolean to set if the setting should be sent to client or not
* `enableQuery` - Only enable this setting if the correspondent setting has the value specified
* `alert` - Shows an alert message with the given text

#### Custom Room Types
Custom room types are now a regular and expected customization to Rocket.Chat. As a result of this, we have expanded
the capabilities which custom room types are given. Custom room types now have full control over the settings which
display on the room's setting tab. To achieve this, however, we had to forcefully break the previous behavior in order
to force the new behavior. If, after merging, you are getting the error `Error: Invalid Room Configuration object, it must extend "RoomTypeConfig"`,
then you will need to modify your custom room code to the class setup explained below.

Implementing the new types requires two steps. First step is to implement a your own custom class to define the route configuration.
Then the second step would be to implement your own room class, which will contain all of the required methods and configuration
for usage in the clients.

##### First Step: RoomTypeRouteConfig
If your room adds a custom route to the browser, then you will need to create a class which extends `RoomTypeRouteConfig`.
This class can be imported using es6 style imports `import { RoomTypeRouteConfig } from 'meteor/rocketchat:lib';`. There
are two fields which are required when constructing your route which is `{ name, path }` and both are strings. Then your
class must implement the `action(params, queryParams)` method.

```javascript
class LivechatRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'live',
			path: '/live/:code(\\d+)'
		});
	}

	action(params) {
		openRoom('l', params.code);
	}

	link(sub) {
		return {
			code: sub.code
		};
	}
}
```

##### Second Step: RoomTypeConfig
Next you need to create a class which extends `RoomTypeConfig`. This class can be imported using the es6 style import
such as `import { RoomTypeConfig } from 'meteor/rocketchat:lib';`. There are two required properties when constructing
your class which is `{ identifier, order }` with the `identifier` being a string and `order` being a number. There are
default implementations of the required methods, so unless you want to overwrite the default behavior, such as disallowing
certain settings, then you will need to implement that method and handle it.

```javascript
class LivechatRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'l',
			order: 5,
			icon: 'livechat',
			label: 'Livechat',
			route: new LivechatRoomRoute() //defined above, see the example
		});
	}

	roomName(roomData) {
		if (!roomData.name) {
			return roomData.label;
		} else {
			return roomData.name;
		}
	}

	condition() {
		return RocketChat.settings.get('Livechat_enabled') && RocketChat.authz.hasAllPermission('view-l-room');
	}
}
```

Then for publishing of the data, you will need to provide the information about the new room with (on the server):

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
    condition: () => {
        return RocketChat.authz.hasAllPermission('view-livechat-manager');
    }
});
```

### Functions
n/a

### Methods
n/a

### Publications
n/a
