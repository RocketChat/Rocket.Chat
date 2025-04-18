## RocketChat

# 简介

RocketChat指的是一系列服务器方法和消息订阅的应用程序接口集合。使用本库第三方应用程序可以通过REST API控制和查询RocketChat服务器。本库专为聊天自动化而设计，使应用程序开发人员能够轻松地为其社区提供最好的解决方案和体验。

注意：RocketChat当前仅支持REST API，一旦OpenHarmony支持WebSocket，本库将开放基于WebSocket的Realtime API。

## 下载安装

```shell
ohpm install @ohos/rocketchat
```

OpenHarmony ohpm环境配置等更多内容，请参考[如何安装OpenHarmony ohpm](https://gitee.com/openharmony-tpc/docs/blob/master/OpenHarmony_har_usage.md)



# 使用说明
```
import rocketchat from '@ohos/rocketchat';
```

功能1:创建维护rocketchat对象的 RestAPI，用于Http/Https通信。

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



### 接口说明

## REST 接口

| 接口名                     | 参数                                           | 说明                                                                                                                                                                                                                                  |
| -------------------------- | ---------------------------------------------- |:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| login                      | 无                                             | 登录用户                                                                                                                                                                                                                                |
| loginWithAuthToken         | authToken                                      | 使用以前颁发的AuthToken让用户登录。                                                                                                                                                                                                              |
| pageVisited                | pageData                                       | 发送访问者导航历史记录。<br/>参数 pageData包含信息标记、rid和pageInfo。                                                                                                                                                                                    |
| visitorRegistration        | visitor                                        | 注册一个新访客。<br/>参数 visitor:对象包含访问者信息:姓名、电子邮件、令牌、电话和自定义字段。                                                                                                                                                                              |
| setVisitorStatus           | visitor                                        | 设置访问者状态。<br/>参数 visitor:对象包含访问者信息:令牌和状态。                                                                                                                                                                                            |
| visitor                    | token                                          | 获取访问者。<br/>参数 token:访问者令牌。                                                                                                                                                                                                          |
| visitorDelete              | token                                          | 删除访问者  <br/>参数 token:访问者令牌。                                                                                                                                                                                                         |
| getBanners                 | 无                                             | 获取已验证用户的用于显示的banners。                                                                                                                                                                                                               |
| bannersEndPoint            | id                                             | 获取已验证用户的用于显示的banners。<br/>参数 id:banner 的id。                                                                                                                                                                                         |
| createChannel              | name, members: Array,readOnly:boolean          | 创建一个新频道。<br/>参数 name:新通道的名称，<br/>参数 members:创建通道时要添加到通道中的用户。<br/>参数 readOnly:设置通道是否为只读。                                                                                                                                             |
| addLeaderChannel           | leaderData                                     | 为当前频道中的用户提供领头者角色。<br/>参数 leaderData:领头者信息。                                                                                                                                                                                          |
| addModeratorChannel        | moderatorData                                  | 为频道中的用户提供管理员角色。<br/>参数 管理员数据。                                                                                                                                                                                                       |
| addOwnerChannel            | ownerData                                      | 为频道中的用户提供所有者角色。<br/>参数:所有者数据。                                                                                                                                                                                                       |
| counterChannel             | roomId, roomName                               | 获取频道数量。                                                                                                                                                                                                                             |
| getUserAllMentionByChannel | roomId                                         | 获取某个频道中成员数量                                                                                                                                                                                                                         |
| filesChannel               | roomId,roomName                                | 返回频道中的文件列表。<br/>参数 roomId:通道的Id。<br/>参数 roomName:通道的名称。                                                                                                                                                                             |
| historyChannel             | roomId,optional参数  s                         | 从频道中检索消息。<br/>roomId:通道的Id。注意:字段latest & oldest应该以UTC格式传递。<br/>optional参数  s :- latest:要检索的消息的时间范围的结束，oldest:要检索的消息的时间范围的开始，inclusive:是否应包括位于latest和oldest的消息，offset:要检索的消息列表的偏移量，count:要检索的消息的数量，unreads:是否应包括未读取的数量。              |
| infoChannel                | roomId,roomName                                | 获取频道的信息。<br/>参数 roomId:通道的Id。<br/>参数 roomName:通道的名称。<br/>                                                                                                                                                                           |
| inviteChannel              | data                                           | 将用户添加到频道。<br/>参数 data:用户数据。                                                                                                                                                                                                         |
| joinChannel                | roomId, joinCode                               | 将自己加入频道。<br/>参数 roomId:通道的Id。<br/>参数 joinCode:房间的连接代码。                                                                                                                                                                              |
| kickChannel                | roomId, userId                                 | 从频道中删除用户。<br/>参数 roomId:通道的Id。<br/>参数 userId:用户的Id。                                                                                                                                                                                 |
| leaveChannel               | roomId                                         | 从频道中删除主叫用户。<br/>参数 roomId:房间的Id。                                                                                                                                                                                                    |
| listChannel                | 无                                             | 从服务器检索所有频道。                                                                                                                                                                                                                         |
| joinListChannel            | 无                                             | 仅检索呼叫用户已加入的频道。                                                                                                                                                                                                                      |
| membersChannel             | roomId,roomName                                | 检索所有频道用户。<br/>参数 roomId:频道的Id。<br/>参数 roomName:频道的名称。                                                                                                                                                                               |
| messageChannel             | roomId,roomName                                | 检索所有频道消息。<br/>参数: roomId:频道的Id。<br/>参数:roomName:频道的名称。                                                                                                                                                                              |
| onlineChannel              | roomId                                         | 列出一个频道的所有在线用户。<br/>参数 roomId:房间的Id。                                                                                                                                                                                                 |
| openChannel                | roomId                                         | 开放频道<br/>参数 roomId:房间的Id。                                                                                                                                                                                                           |
| renameChannel              | roomId, name                                   | 更改频道的名称。                                                                                                                                                                                                                            |
| rolesChannel               | roomId,roomName                                | 获取用户在通道中的角色。<br/>参数 roomId:通道的Id。<br/>参数 roomName:通道的名称                                                                                                                                                                             |
| setCustomFieldsChannel     | roomId, roomName, customField                  | 设置频道的自定义字段。<br/>参数 roomId:通道的Id。<br/>参数 roomName:通道的名称。<br/>参数 customField:为通道设置的自定义字段..                                                                                                                                            |
| setJoinCodeChannel         | roomId, joinCode                               | 设置加入频道所需的频道代码。<br/>参数 roomId:通道的Id。<br/>参数 joinCode:房间的连接代码。                                                                                                                                                                        |
| setPurposeChannel          | roomId, purpose                                | 设置频道的描述。<br/>参数 roomId:通道的Id。<br/>参数 purpose:通道的目的。                                                                                                                                                                                 |
| setTopicChannel            | roomId, topic                                  | 设置频道的主题。<br/>参数 roomId:通道的Id。<br/>参数 topic:要设置的频道主题。                                                                                                                                                                                |
| setTypeChannel             | roomId, roomName, channelType                  | 设置频道的房间类型。<br/>参数 roomId:通道的Id。<br/>参数 roomName:通道的名称。<br/>参数 channelType:通道的类型。                                                                                                                                                    |
| archiveChannel             | roomId                                         | 存档频道。<br/>参数 roomId:房间的Id。                                                                                                                                                                                                          |
| deleteChannel              | roomId,roomName                                | 删除一个频道。<br/>参数 roomId:通道的Id。<br/>参数 roomName:通道的名称。                                                                                                                                                                                 |
| groupAddLeader             | groupID: string, userId: string                | 为当前组中的用户提供领头者角色。<br/>参数  groupID:组的ID。<br/>参数  userId:用户的Id。                                                                                                                                                                        |
| groupAddModerator          | groupID: string, userId: string                | 向组中的用户授予管理员角色。<br/>参数   groupID:组的ID，<br/>参数   userId:用户的id。                                                                                                                                                                        |
| groupArchive               | groupID: string                                | 存档一个私人组。<br/>参数   groupID:组的ID。                                                                                                                                                                                                     |
| groupUnArchive             | groupID: string                                | 取消私人组的存档。<br/>参数   groupID:组的ID。                                                                                                                                                                                                    |
| groupCreate                | name: string, members: Array,readOnly: boolean | 创建新的私人群组。<br/>参数   name:新专用组的名称。<br/>参数   members:创建组时要添加到组中的用户。<br/>参数   readOnly:设置通道是否只读。                                                                                                                                        |
| groupAddAll                | groupID: string,activeUsersOnly:boolean        | 将服务器上的所有用户添加到专用组。<br/>参数   groupID:组的ID。<br/>参数   activeUsersOnly:仅添加活动用户。                                                                                                                                                          |
| groupDelete                | roomId: string,roomName:string                 | 移除私人频道。<br/>参数   roomId:房间的Id。<br/>参数   roomName:房间的名称。                                                                                                                                                                             |
| groupInvite                | groupID: string, userId: string                | 将用户添加到专用组。<br/>参数   groupID:组的ID。<br/>参数   userId:用户的Id。                                                                                                                                                                            |
| groupRename                | name: string, groupID: string                  | 更改私人通话组的名称。<br/>参数   name:专用组的名称。<br/>参数   groupID:组的ID。                                                                                                                                                                            |
| groupAddOwner              | groupID: string,userId:string                  | 向组中的用户授予所有者角色。<br/>参数   groupID:组的ID。<br/>参数   userId:用户的Id。                                                                                                                                                                        |
| groupRemoveOwner           | groupID: string,userId:string                  | 删除组中用户的所有者角色。<br/>参数   groupID:组的ID。<br/>参数   userId:用户的Id。                                                                                                                                                                         |
| groupRemoveModerator       | groupID: string,userId:string                  | 删除当前组中用户的管理员角色。<br/>参数   groupID:组的ID。<br/>参数   userId:用户的Id。                                                                                                                                                                       |
| groupSetPurpose            | groupID: string, groupPurpose: string          | 设置私人组的描述。<br/>参数   groupID:组的ID。<br/>参数   groupPurpose:组的目的。                                                                                                                                                                        |
| groupSetDescription        | groupID: string, groupDescription: string      | 设置私人组的描述。<br/>参数   groupID:组的ID。<br/>参数   groupDescription:组的描述。                                                                                                                                                                    |
| groupOpen                  | groupID: string                                | 将私人组重新添加到组列表中。<br/>参数   groupID:组的ID。                                                                                                                                                                                               |
| groupClose                 | groupID: string                                | 从组列表中删除私人组。<br/>参数   groupID:组的ID。                                                                                                                                                                                                  |
| groupKick                  | groupID: string, userId:string                 | 从私人组中删除用户。<br/>参数   groupID:组的ID。<br/>参数   userId:用户的Id。                                                                                                                                                                            |
| groupLeave                 | groupID: string                                | 从私人通话组中删除主叫用户。<br/>参数   groupID:组的ID。                                                                                                                                                                                               |
| groupSetReadOnly           | groupID: string, readOnly: boolean             | 设置房间是否为只读。<br/>参数   groupID:组的ID。<br/>参数   readOnly:组是否为只读的布尔值。                                                                                                                                                                     |
| groupSetTopic              | groupID: string, groupTopic: string            | 设置私人群组的主题。<br/>参数   groupID:组的ID。<br/>参数   groupTopic:组的主题。                                                                                                                                                                         |
| groupSetType               | groupID: string, groupType: string             | 设置该组的房间类型。<br/>参数   groupID:组的ID。<br/>参数   groupType:组的类型。                                                                                                                                                                          |
| groupInfo                  | roomId, roomName                               | 检索有关私人组的信息。<br/>参数   roomId:房间的Id。<br/>参数   roomName:房间的名称。                                                                                                                                                                         |
| groupList                  | 无                                             | 列出来电者所属的私人群组。                                                                                                                                                                                                                       |
| groupHistory               | roomId,optional参数  s                         | 从专用组中检索消息。<br/>参数  roomId:组的Id。注意:字段latest & oldest应该以UTC格式传递。<br/>参数   optional参数  s :- latest:要检索的消息的时间范围的结束时间，oldest:要检索的消息的时间范围的开始时间，inclusive:是否应包括位于latest和oldest的消息，offset:要检索的列表消息的偏移量，count:要检索的消息的数量，unreads:是否应包括未读取的数量。 |
| groupIntegrations          | roomId                                         | 获取某个房间所有组。<br/>参数   roomId:房间的Id。                                                                                                                                                                                                   |
| logout                     | 无                                             | 注销客户端                                                                                                                                                                                                                               |
| loggedIn                   | 无                                             | 获取登录的布尔状态                                                                                                                                                                                                                           |
| closeChannel               | roomId                                         | 从用户的频道列表中删除频道。<br/>参数   roomId:房间的Id。                                                                                                                                                                                               |
| addAllChannel              | roomId                                         | 把RocketChat服务器的所有用户添加到频道。<br/>参数   roomId:房间的Id。                                                                                                                                                                                    |
| removeLeaderChannel        | roomId, userId                                 | 删除用户在当前频道中的Leader角色。<br/>参数   roomId:通道的Id。<br/>参数   userId:用户的Id。                                                                                                                                                                  |
| removeModeratorChannel     | roomId, userId                                 | 删除组中用户的管理员角色。<br/>参数   roomId:通道的Id。<br/>参数   userId:用户的Id。                                                                                                                                                                         |
| removeOwnerChannel         | roomId, userId                                 | 删除用户在频道中的owner角色。<br/>参数   roomId:通道的Id。<br/>参数   userId:用户的Id。                                                                                                                                                                     |
| setDefaultChannel          | roomId, isDefault                              | 设置默认频道。<br/>参数   roomId:房间的Id。<br/>参数   isDefault:是否设置频道为默认。                                                                                                                                                                        |
| setReadOnlyChannel         | roomId, readOnly                               | 设置频道是否为只读。<br/>参数   roomId:通道的Id。<br/>参数   readOnly:房间是否只读的布尔值。                                                                                                                                                                     |
| unArchiveChannel           | roomId                                         | 取消频道存档。<br/>参数   roomId:房间的Id。                                                                                                                                                                                                      |
| userCreate                 | data                                           | 创建新用户。需要管理员权限。<br/>参数 data:用户数据。                                                                                                                                                                                                    |
| usersInfo                  | user_id, userName                              | 检索有关用户<br/>参数 user_id:用户id。<br/>参数   userName:用户名。                                                                                                                                                                                  |
| usersPresence              | data                                           | 获取用户在线状态                                                                                                                                                                                                                            |
| usersList                  | data                                           | 获取系统中的所有用户及其信息。                                                                                                                                                                                                                     |
| setAvatar                  | avatarData                                     | 设置头像                                                                                                                                                                                                                                |
| userDelete                 | data                                           | 删除一个用户                                                                                                                                                                                                                              |
| settings                   | 无                                             | 列出所有私有设置                                                                                                                                                                                                                            |
| getIntegrationChannel      | roomId                                         | 获取某个房间的所有频道                                                                                                                                                                                                                         |
| postMessageChat            | postMessageData                                | 发送新的聊天消息                                                                                                                                                                                                                            |
| updateMessageChat          | roomId, msgId, msg                             | 更新现有聊天消息                                                                                                                                                                                                                            |
| deleteMessageChat          | roomId, msgId, asUser                          | 删除现有聊天消息                                                                                                                                                                                                                            |
| me                         | 无                                             | 获取登录后的用户信息                                                                                                                                                                                                                          |

## 约束与限制
在下述版本验证通过：

DevEco Studio: NEXT Beta1-5.0.3.806, SDK: API12 Release(5.0.0.66)

DevEco Studio 版本： 4.1 Canary(4.1.3.317),OpenHarmony SDK:API11 (4.1.0.36)。

## 目录结构

```javascript
|---- RocketChat  
|     |---- entry  # 示例代码文件夹
|     |---- rocketchat  # rocketchat 库文件夹
|           |---- index.ets  # rocketchat对外接口
|     |---- README.MD  # 安装使用方法
|     |---- README_zh.MD  # 安装使用方法   
```

## 贡献代码

使用过程中发现任何问题都可以提 [Issue](https://gitee.com/openharmony-tpc/RocketChat/issues)给组件，当然，也非常欢迎发 [PR](https://gitee.com/openharmony-tpc/RocketChat/pulls)共建 。

## 开源协议

本项目基于 [MIT License](https://gitee.com/openharmony-tpc/RocketChat/blob/master/LICENSE)，请自由地享受和参与开源。

