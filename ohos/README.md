## Rocket.Chat

# Introduction

Rocket.Chat is a collection of server methods and message subscription APIs. Third-party applications using this library can control and query the Rocket.Chat server through the REST APIs. Designed for chat automation, this library enables you to easily provide the optimal solution and experience for your communities.

Note: Currently, Rocket.Chat supports only REST APIs. Once OpenHarmony supports WebSocket, this library will open WebSocket-based Realtime APIs.

## How to Install

```shell
ohpm install @ohos/rocketchat
```

For details about the OpenHarmony ohpm environment configuration, see [OpenHarmony HAR](https://gitee.com/openharmony-tpc/docs/blob/master/OpenHarmony_har_usage.en.md).



# How to Use
```
import rocketchat from '@ohos/rocketchat';
```

Function 1: Creates a REST API to maintain the Rocket.Chat object for HTTP/HTTPS communication.

```typescript

const restAPI = new RestAPI("https://open.rocket.chat/api/v1/", USERNAME, PASSWORD);

// VARIABLES
var authToken = null;
var visitorToken = null;
var rid = null;
var agentId = null;
var userId = null;
var visitorId = null;
var visitorEmail = null;
var channelId = null;


// Login using Credentials
 restAPI.login().then(function (data) {
      authToken = data.data.authToken;
      userId = data.data.userId;
      that.showToast("Success");
    }).catch(function (error) {
      that.showToast("Error :" + error);
    });

// Use any of the methods implemented in the package.
```



### Available APIs

## REST APIs

| API                    | Parameter                                          | Description                                                        |
| -------------------------- | ---------------------------------------------- | :----------------------------------------------------------- |
| login                      | N/A                                            | User login.                                                    |
| loginWithAuthToken         | authToken                                      | User login using the previously issued **AuthToken**.                         |
| pageVisited                | pageData                                       | Sending the navigation history of a visitor.<br>**pageData** contains the information flag, **rid**, and **pageInfo**.|
| visitorRegistration        | visitor                                        | Registering a visitor.<br>The **visitor** object contains the visitor information, including the name, email address, token, phone number, and custom field.|
| setVisitorStatus           | visitor                                        | Setting the visitor status.<br>The **visitor** object contains the visitor information, including the token and status.|
| visitor                    | token                                          | Obtaining a visitor.<br>**token** indicates the visitor token.                    |
| visitorDelete              | token                                          | Deleting a visitor.<br>**token** indicates the visitor token.                    |
| getBanners                 | N/A                                            | Obtaining **banners** to be displayed for an authenticated user.                         |
| bannersEndPoint            | id                                             | Obtaining **banners** to be displayed for an authenticated user.<br>**id:banner** indicates the banner ID.|
| createChannel              | name, members: Array, readOnly: boolean         | Creating a channel.<br>**name** indicates the name of the new channel.<br>**members** indicates users to be added to the channel during creation.<br>**readOnly** specifies whether the channel is read-only.|
| addLeaderChannel           | leaderData                                     | Providing the leader role for users in the current channel.<br>**leaderData** indicates the leader information.|
| addModeratorChannel        | moderatorData                                  | Providing the administrator role for users in a channel.<br>**moderatorData** indicates the administrator data.        |
| addOwnerChannel            | ownerData                                      | Providing the owner role for users in a channel.<br>**ownerData** indicates the owner data.        |
| counterChannel             | roomId, roomName                               | Obtaining the number of channels.                                              |
| getUserAllMentionByChannel | roomId                                         | Obtaining the number of members in a channel.                                      |
| filesChannel               | roomId, roomName                               | Returning the list of files in a channel.<br>**roomId** indicates the channel ID.<br>**roomName** indicates the channel name.|
| historyChannel             | roomId, optional parameters                        | Searching for messages from a channel.<br>**roomId** indicates the channel ID. Note: The **latest & oldest** field must be transferred in UTC format.<br>Optional parameters: **latest** indicates the end time of the time range of the message to be searched for; **oldest** indicates the start time of the time range of the message to be searched for; **inclusive** specifies whether the messages at the **latest** and **oldest** time should be included; **offset** indicates the offset of the list of the message to be searched for; **count** indicates the number of messages to be searched for; **unreads** specifies whether the number of unread messages should be included.|
| infoChannel                | roomId, roomName                               | Obtaining the channel information.<br>**roomId** indicates the channel ID.<br>**roomName** indicates the channel name.<br>|
| inviteChannel              | data                                           | Adding a user to the channel.<br>**data** indicates the user data.                 |
| joinChannel                | roomId, joinCode                               | Adding the current user to a channel.<br>**roomId** indicates the channel ID.<br>**joinCode** indicates the connection code to join a room.|
| kickChannel                | roomId, userId                                 | Removing a user from a channel.<br>**roomId** indicates the channel ID.<br>**userId** indicates the user ID.|
| leaveChannel               | roomId                                         | Removing a calling party from a channel.<br>**roomId** indicates the room ID.           |
| listChannel                | N/A                                            | Searching for all channels from the server.                                      |
| joinListChannel            | N/A                                            | Searching for only the channels that a calling party has joined.                                |
| membersChannel             | roomId,roomName                                | Searching for all channel users.<br>**roomId** indicates the channel ID.<br>**roomName** indicates the channel name.|
| messageChannel             | roomId, roomName                               | Searching for all channel messages.<br>**roomId** indicates the channel ID.<br>**roomName** indicates the channel name.|
| onlineChannel              | roomId                                         | Listing all online users of a channel.<br>**roomId** indicates the room ID.     |
| openChannel                | roomId                                         | Open channel.<br>**roomId** indicates the room ID.                         |
| renameChannel              | roomId, name                                   | Changing the channel name.                                            |
| rolesChannel               | roomId, roomName                               | Obtaining the role of a user in a channel.<br>**roomId** indicates the channel ID.<br>**roomName** indicates the channel name.|
| setCustomFieldsChannel     | roomId, roomName, customField                  | Setting the custom fields of a channel.<br>**roomId** indicates the channel ID.<br>**roomName** indicates the channel name.<br>**customField** indicates the custom field set for a channel.|
| setJoinCodeChannel         | roomId, joinCode                               | Setting the channel code required for joining a channel.<br>**roomId** indicates the channel ID.<br>**joinCode** indicates the connection code to join a channel.|
| setPurposeChannel          | roomId, purpose                                | Setting the description of a channel.<br>**roomId** indicates the channel ID.<br>**purpose** indicates the purpose of a channel.|
| setTopicChannel            | roomId, topic                                  | Setting the theme of a channel.<br>**roomId** indicates the channel ID.<br>**topic** indicates the channel theme to be set.|
| setTypeChannel             | roomId, roomName, channelType                  | Setting the room type of a channel.<br>**roomId** indicates the channel ID.<br>**roomName** indicates the channel name.<br>**channelType** indicates the channel type.|
| archiveChannel             | roomId                                         | Archive channel.<br>**roomId** indicates the room ID.                       |
| deleteChannel              | roomId, roomName                               | Deleting a channel.<br>**roomId** indicates the channel ID.<br>**roomName** indicates the channel name.|
| groupAddLeader             | groupID: string, userId: string                | Providing the leader role for users in the current group.<br>**groupID** indicates the group ID.<br>**userId** indicates the user ID.|
| groupAddModerator          | groupID: string, userId: string                | Granting the administrator role to users in a group.<br>**groupID** indicates the group ID.<br>**userId** indicates the user ID.|
| groupArchive               | groupID: string                                | Archiving a private group.<br>**groupID** indicates the group ID.                |
| groupUnArchive             | groupID: string                                | Cancelling the archive of a private group.<br>**groupID** indicates the group ID.              |
| groupCreate                | name: string, members: Array, readOnly: boolean| Creating a private group.<br>**name** indicates the name of the new dedicated group.<br>**members** indicates users to be added to the group during group creation.<br>**readOnly** specifies whether the channel is read-only.|
| groupAddAll                | groupID: string, activeUsersOnly: boolean       | Adding all users on the server to a dedicated group.<br>**groupID** indicates the group ID.<br>**activeUsersOnly** indicates that only active users are added.|
| groupDelete                | roomId: string, roomName: string                | Removing a private channel.<br>**roomId** indicates the room ID.<br>**roomName** indicates the room name.|
| groupInvite                | groupID: string, userId: string                | Adding a user to a dedicated group.<br>**groupID** indicates the group ID.<br>**userId** indicates the user ID.|
| groupRename                | name: string, groupID: string                  | Modifying the name of a private call group.<br>**name** indicates the name of a dedicated group.<br>**groupID** indicates the group ID.|
| groupAddOwner              | groupID: string, userId: string                 | Granting the owner role to users in a group.<br>**groupID** indicates the group ID.<br>**userId** indicates the user ID.|
| groupRemoveOwner           | groupID: string, userId: string                 | Deleting the owner role of a user from a group.<br>**groupID** indicates the group ID.<br>**userId** indicates the user ID.|
| groupRemoveModerator       | groupID: string, userId: string                 | Deleting the administrator role of a user from the current group.<br>**groupID** indicates the group ID.<br>**userId** indicates the user ID.|
| groupSetPurpose            | groupID: string, groupPurpose: string          | Setting the description of a private group.<br>**groupID** indicates the group ID.<br>**groupPurpose** indicates the purpose of a group.|
| groupSetDescription        | groupID: string, groupDescription: string      | Setting the description of a private group.<br>**groupID** indicates the group ID.<br>**groupDescription** indicates the group description.|
| groupOpen                  | groupID: string                                | Adding a private group to the group list again.<br>**groupID** indicates the group ID.    |
| groupClose                 | groupID: string                                | Deleting a private group from the group list.<br>**groupID** indicates the group ID.          |
| groupKick                  | groupID: string, userId: string                | Deleting a user from a private group.<br>**groupID** indicates the group ID.<br>**userId** indicates the user ID.|
| groupLeave                 | groupID: string                                | Deleting a calling party from a private call group.<br>**groupID** indicates the group ID.    |
| groupSetReadOnly           | groupID: string, readOnly: boolean             | Specifying whether a room is read-only.<br>**groupID** indicates the group ID.<br>The value of **readOnly** is a Boolean value indicating whether a group is read-only.|
| groupSetTopic              | groupID: string, groupTopic: string            | Setting the theme of a private group.<br>**groupID** indicates the group ID.<br>**groupTopic** indicates the group theme.|
| groupSetType               | groupID: string, groupType: string             | Setting the room type of a group.<br>**groupID** indicates the group ID.<br>**groupType** indicates the group type.|
| groupInfo                  | roomId, roomName                               | Searching for information about a private group.<br>**roomId** indicates the room ID.<br>**roomName** indicates the room name.|
| groupList                  | N/A                                            | Listing the private groups to which a caller belongs.                                  |
| groupHistory               | roomId, optional parameters                        | Searching for messages from a dedicated group.<br>**roomId** indicates the group ID. Note: The **latest & oldest** field must be transferred in UTC format.<br>Optional parameters: **latest** indicates the end time of the time range of the message to be searched for; **oldest** indicates the start time of the time range of the message to be searched for; **inclusive** specifies whether the messages at the **latest** and **oldest** time should be included; **offset** indicates the offset of the list message to be searched for; **count** indicates the number of messages to be searched for; **unreads** specifies whether the number of unread messages should be included.|
| groupIntegrations          | roomId                                         | Obtaining all groups in a room.<br>**roomId** indicates the room ID.           |
| logout                     | N/A                                            | Logging out of the client.                                                  |
| loggedIn                   | N/A                                            | Obtaining the Boolean status of login.                                          |
| closeChannel               | roomId                                         | Deleting a channel from a channel list of a user.<br>**roomId** indicates the room ID.   |
| addAllChannel              | roomId                                         | Adding all users of the Rocket.Chat server to a channel.<br>**roomId** indicates the room ID.|
| removeLeaderChannel        | roomId, userId                                 | Deleting the leader role of a user from the current channel.<br>**roomId** indicates the channel ID.<br>**userId** indicates the user ID.|
| removeModeratorChannel     | roomId, userId                                 | Deleting the administrator role of a user from a group.<br>**roomId** indicates the channel ID.<br>**userId** indicates the user ID.|
| removeOwnerChannel         | roomId, userId                                 | Deleting the owner role of a user from a channel.<br>**roomId** indicates the channel ID.<br>**userId** indicates the user ID.|
| setDefaultChannel          | roomId, isDefault                              | Setting the default channel.<br>**roomId** indicates the room ID.<br>**isDefault** specifies whether to set a channel as the default channel.|
| setReadOnlyChannel         | roomId, readOnly                               | Specifying whether a channel is read-only.<br>**roomId** indicates the channel ID.<br>The value of **readOnly** is a Boolean value indicating whether a room is read-only.|
| unArchiveChannel           | roomId                                         | Cancelling the archive of a channel.<br>**roomId** indicates the room ID.                 |
| userCreate                 | data                                           | Creating a user. Only the administrator has the permission to perform this operation.<br>**data** indicates the user data.       |
| usersInfo                  | user_id, userName                              | Searching for related users.<br>**user_id** indicates the user ID.<br>**userName** indicates the username.|
| usersPresence              | data                                           | Obtaining the online status of a user.                                            |
| usersList                  | data                                           | Obtaining all users and their information in the system.                              |
| setAvatar                  | avatarData                                     | Setting a profile picture.                                                    |
| userDelete                 | data                                           | Deleting a user.                                                |
| settings                   | N/A                                            | Listing all private settings.                                            |
| getIntegrationChannel      | roomId                                         | Obtaining all channels in a room.                                      |
| postMessageChat            | postMessageData                                | Sending a new chat message.                                            |
| updateMessageChat          | roomId, msgId, msg                             | Updating an existing chat message.                                            |
| deleteMessageChat          | roomId, msgId, asUser                          | Deleting an existing chat message.                                            |
| me                         | N/A                                            | Obtaining the information about a user who has signed in.                                        |

## Constraints
This project has been verified in the following versions:

DevEco Studio: 4.1 Canary (4.1.3.317), OpenHarmony SDK: API 11 (4.1.0.36)

## Directory Structure

```javascript
|---- Rocket.Chat 
|     |---- entry  # Sample code
|     |---- rocketchat  # Rocket.Chat library
|           |---- index.ets  # Rocket.Chat external APIs
|     |---- README.MD  # Readme 
|     |---- README_zh.MD  # Readme
```

## How to Contribute

If you find any problem when using the project, submit an [issue](https://gitee.com/openharmony-tpc/RocketChat/issues) or a [PR](https://gitee.com/openharmony-tpc/RocketChat/pulls).

## License

This project is licensed under [MIT License](https://gitee.com/openharmony-tpc/RocketChat/blob/master/LICENSE).
