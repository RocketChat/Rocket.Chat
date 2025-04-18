/**
 *  MIT License
 *
 *  Copyright (c) 2023 Huawei Device Co., Ltd.
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 */

import {HttpRequestConnector} from './core/HttpRequestConnector';

export class RestAPI {
  private httpRequestConnector: HttpRequestConnector;
  private username: string;
  private password: string;
  private authToken: string;
  private userID: string;

  constructor(url: string, username: string, password: string) {
    this.httpRequestConnector = new HttpRequestConnector(url);
    this.username = username;
    this.password = password;
  }

  public login(): Promise<any>{
    var that = this;
    let user = null;
    if (that.username.includes('@')) {
      user = {
        email: this.username,
        password: this.password
      };
    } else {
      user = {
        username: this.username,
        password: this.password
      };
    }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('login', user, false).then(function (data) {
        var result = JSON.parse(data);
        console.info('LOGIN response : X-Auth-Token:' + result.data.authToken);
        console.info('LOGIN response : X-User-Id:' + result.data.userId);
        that.httpRequestConnector.setUserData(result.data.authToken, result.data.userId)
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Login with AuthToken
     */
  public loginWithAuthToken(authToken) {
    var that = this;
    let data = {
      resume: authToken
    };
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('login', data, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Page Visited
     */
  public pageVisited(pageData) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('livechat/page.visited', pageData, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }


  /*
    Visitor visitorRegistration
     */
  public visitorRegistration(visitor): Promise<any>{
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('livechat/visitor', visitor, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Visitor visitor
     */
  public visitor(token) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get('livechat/visitor/' + token, null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Visitor setVisitorStatus
     */
  public setVisitorStatus(visitor) {
    var that = this;
    console.info("VisitorStatus RestApi" + JSON.stringify(visitor));
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('livechat/visitor.status', visitor, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Visitor delete
     */
  public visitorDelete(token) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.delete('livechat/visitor/' + token, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Banners EndPoint
     */
  public bannersEndPoint(id) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get('banners/:id' + id + "?platform=web", null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Banners EndPoint
     */
  public getBanners() {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get('banners?platform=web', null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Add Create Channel
     */
  public createChannel(name, members: Array<string>, readOnly: boolean): Promise<any>{
    var that = this;
    const data = { "name": name, "members": members, "readOnly": readOnly }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.create', data, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    AddAll Users
     */
  public async addAllChannel(roomId, activeUsersOnly): Promise<any> {
    var that = this;
    var data = { "roomId": roomId, "activeUsersOnly": activeUsersOnly }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.addAll', data, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }


  /*
    Add Leader Channel
     */
  public addLeaderChannel(leaderData) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.addLeader', leaderData, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Add Moderator Channel
     */
  public addModeratorChannel(moderatorData) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.addModerator', moderatorData, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Add Owner Channel
     */
  public addOwnerChannel(ownerData) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.addOwner', ownerData, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Add Counter Channel
     */
  public counterChannel(roomId, roomName) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get('channels.counters?roomId=' + roomId, null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Get User All Mention By Channel
     */
  public getUserAllMentionByChannel(roomId) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get('channels.getAllUserMentionsByChannel?roomId=' + roomId, null, true)
        .then(function (data) {
          var result = JSON.parse(data);
          resolve(result);
        })
        .catch(function (error) {
          reject(error);
        });
    });
  }

  /*
    Files Channel
     */
  public filesChannel(roomId, roomName) {
    var that = this;
    var endpoint;

    if ((roomId?.trim()?.length || 0) > 0) {
      endpoint = 'channels.files?roomId=' + roomId;
    }
    else {
      endpoint = 'channels.files?roomName=' + roomName;
    }
    console.info("channels.files endpoint: " + endpoint);

    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get(endpoint, null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }


  /*
    Get History Channel
     */
  public historyChannel(roomId, optionalParams) {
    var that = this;
    var url = 'channels.history?roomId=' + roomId;

    if (optionalParams != null || optionalParams != undefined || Object.keys(optionalParams).length > 0) {
      if (optionalParams.latest) {
        url = url + '&latest=' + optionalParams.latest;
      }

      if (optionalParams.oldest) {
        url = url + '&oldest=' + optionalParams.oldest;
      }

      if (optionalParams.inclusive) {
        url = url + '&inclusive=' + optionalParams.inclusive;
      }
      else if (optionalParams.inclusive === false) {
        url = url + '&inclusive=' + false;
      }

      if (optionalParams.offset) {
        url = url + '&offset=' + optionalParams.offset;
      }
      else if (optionalParams.offset === 0) {
        url = url + '&offset=0';
      }

      if (optionalParams.count) {
        url = url + '&count=' + optionalParams.count;
      }
      else if (optionalParams.count === 0) {
        url = url + '&count=20';
      }

      if (optionalParams.unreads) {
        url = url + '&unreads=' + optionalParams.unreads;
      }
      else if (optionalParams.unreads === false) {
        url = url + '&unreads=' + false;
      }

    }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get(url, null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    })
  }

  /*
    Get Info Channel
     */
  public infoChannel(roomId, roomName) {
    var that = this;
    var endpoint;

    if ((roomId?.trim()?.length || 0) > 0) {
      endpoint = 'channels.info?roomId=' + roomId;
    }
    else {
      endpoint = 'channels.info?roomName=' + roomName;
    }
    console.info("channels.info endpoint: " + endpoint);

    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get(endpoint, null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    })
  }

  /*
    Get Invite Channel
     */
  public inviteChannel(data) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.invite', data, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Get Join Channel
     */
  public joinChannel(roomId, joinCode) {
    var data = { "roomId": roomId, "joinCode": joinCode }
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.join', data, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Get Kick Channel
     */
  public kickChannel(roomId, userId) {
    var data = { "roomId": roomId, "userId": userId }
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.kick', data, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Get Leave Channel
     */
  public leaveChannel(roomId) {
    var that = this;
    var data = { "roomId": roomId }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.leave', data, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Get List Channel
     */
  public listChannel() {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get('channels.list', null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Get Join List Channel
     */
  public joinListChannel() {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get('channels.list.joined', null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Get Members Channel
     */
  public membersChannel(roomId, roomName) {
    var that = this;
    var endpoint;

    if ((roomId?.trim()?.length || 0) > 0) {
      endpoint = 'channels.members?roomId=' + roomId;
    }
    else {
      endpoint = 'channels.members?roomName=' + roomName;
    }
    console.info("channels.members endpoint: " + endpoint);

    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get(endpoint, null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    })
  }

  /*
    Get Message Channel
     */
  public messageChannel(roomId, roomName) {
    var that = this;
    var channelData = null;
    if ((roomId?.trim()?.length || 0) > 0) {
      channelData = 'channels.messages?roomId=' + roomId
    }
    else {
      channelData = 'channels.messages?roomName=' + roomName
    }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get(channelData, null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Online Channel
     */
  public onlineChannel(roomId) {
    var id = { "_id": roomId }
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get('channels.online?query=' + JSON.stringify(id), null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Open Channel
     */
  public openChannel(roomId) {
    var channel = { "roomId": roomId }
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.open', channel, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }


  /*
    Rename Channel
     */
  public renameChannel(roomId, name) {
    var channelData = { "roomId": roomId, "name": name }
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.rename', channelData, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Roles Channel
     */
  public rolesChannel(roomId, roomName) {
    var that = this;
    var endpoint;

    if ((roomId?.trim()?.length || 0) > 0) {
      endpoint = 'channels.roles?roomId=' + roomId;
    }
    else {
      endpoint = 'channels.roles?roomName=' + roomName;
    }
    console.info("rolesChannel endpoint: " + endpoint);

    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get(endpoint, null, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Set Announcement Channel
     */
  public setAnnouncementChannel(roomId, announcement) {
    var channelData = { "roomId": roomId, "announcement": announcement }
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.setAnnouncement', channelData, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Set Custom Fields Channel
     */
  public setCustomFieldsChannel(roomId, roomName, customField) {
    var that = this;

    var channelData = null;
    if ((roomId?.trim()?.length || 0) > 0) {
      channelData = { "roomId": roomId, "customFields": customField }
    }
    else {
      channelData = { "roomName": roomName, "customFields": customField }
    }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.setCustomFields', channelData, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Set Join Code Channel
     */
  public setJoinCodeChannel(roomId, joinCode) {
    var that = this;
    var channelData = { "roomId": roomId, "joinCode": joinCode }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.setJoinCode', channelData, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Set Channel Purpose
     */
  public setPurposeChannel(roomId, purpose) {
    var that = this;
    var channelData = { "roomId": roomId, "purpose": purpose }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.setPurpose', channelData, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }


  /*
    Set Topic Channel
     */
  public setTopicChannel(roomId, topic) {
    var channelData = { "roomId": roomId, "topic": topic }
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.setTopic', channelData, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Set Type Channel
     */
  public setTypeChannel(roomId, roomName, channelType) {
    var that = this;
    var channelData = null;
    if ((roomId?.trim()?.length || 0) > 0) {
      channelData = { "roomId": roomId, "type": channelType }
    }
    else {
      channelData = { "roomName": roomName, "type": channelType }
    }

    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.setType', channelData, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Add Archive Channel
     */
  public archiveChannel(roomId) {
    var that = this;
    var data = { "roomId": roomId };
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.archive', data, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Add Delete Channel
     */
  public deleteChannel(roomId, roomName) {
    var that = this;
    var data;
    if ((roomId?.trim()?.length || 0) > 0) {
      data = { "roomId": roomId };
    }
    else {
      data = { "roomName": roomName };
    }

    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.delete', data, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupAddLeader(groupID: string, userId: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.addLeader', {
        roomId: groupID,
        userId: userId
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupAddModerator(groupID: string, userId: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.addModerator', {
        roomId: groupID,
        userId: userId
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupArchive(groupID: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.archive', {
        roomId: groupID,
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupUnArchive(groupID: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.unarchive', {
        roomId: groupID,
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupCreate(name: string, members: Array<string>, readOnly: boolean): Promise<any>{
    var that = this;
    const data = { "name": name, "members": members, "readOnly": readOnly }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.create', data, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupInvite(groupID: string, userId: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.invite', {
        "roomId": groupID,
        "userId": userId
      }).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupRename(name: string, groupID: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.rename', {
        "roomId": groupID,
        "name": name
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupDelete(roomId: string, roomName: string) {
    var that = this;
    var data;

    if ((roomId?.trim()?.length || 0) > 0) {
      data = { "roomId": roomId }
    }
    else {
      data = { "roomName": roomName }
    }
    console.info("groups.delete data: " + data);

    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.delete',
        data,
        false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupAddAll(groupID: string, activeUsersOnly: boolean) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.addAll',
        {
          "roomId": groupID,
          "activeUsersOnly": activeUsersOnly,
        }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupAddOwner(groupID: string, userId: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.addOwner', { roomId: groupID, userId: userId
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupRemoveOwner(groupID: string, userId: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.removeOwner', { roomId: groupID, userId: userId
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupRemoveModerator(groupID: string, userId: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.removeModerator', { "roomId": groupID, "userId": userId
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupSetPurpose(groupID: string, groupPurpose: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.setPurpose', { roomId: groupID, purpose: groupPurpose
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupSetDescription(groupID: string, groupDescription: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.setDescription', { roomId: groupID, description: groupDescription
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupOpen(groupID: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.open', { roomId: groupID
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupClose(groupID: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.close', { roomId: groupID
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupKick(groupID: string, userId: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.kick', { roomId: groupID, userId: userId
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupLeave(groupID: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.leave', { roomId: groupID
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupSetReadOnly(groupID: string, readOnly: boolean) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.setReadOnly', { roomId: groupID, readOnly: readOnly
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupSetTopic(groupID: string, groupTopic: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.setTopic', { roomId: groupID, topic: groupTopic
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupSetType(groupID: string, groupType: string) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('groups.setType', { roomId: groupID, "type": groupType
      }, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupInfo(roomId, roomName) {
    var that = this;
    var endpoint;

    if ((roomId?.trim()?.length || 0) > 0) {
      endpoint = 'groups.info?roomId=' + roomId;
    }
    else {
      endpoint = 'groups.info?roomName=' + roomName;
    }
    console.info("groups.info endpoint: " + endpoint);

    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get(endpoint, null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupIntegrations(roomId) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get('groups.getIntegrations?roomId=' + roomId, null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupList() {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get('groups.list', null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public groupHistory(roomId, optionalParams) {
    var that = this;

    var url = 'groups.history?roomId=' + roomId;

    if (optionalParams != null || optionalParams != undefined || Object.keys(optionalParams).length > 0) {
      if (optionalParams.latest) {
        url = url + '&latest=' + optionalParams.latest;
      }

      if (optionalParams.oldest) {
        url = url + '&oldest=' + optionalParams.oldest;
      }

      if (optionalParams.inclusive) {
        url = url + '&inclusive=' + optionalParams.inclusive;
      }
      else if (optionalParams.inclusive === false) {
        url = url + '&inclusive=' + false;
      }

      if (optionalParams.offset) {
        url = url + '&offset=' + optionalParams.offset;
      }
      else if (optionalParams.offset === 0) {
        url = url + '&offset=0';
      }

      if (optionalParams.count) {
        url = url + '&count=' + optionalParams.count;
      }
      else if (optionalParams.count === 0) {
        url = url + '&count=20';
      }

      if (optionalParams.unreads) {
        url = url + '&unreads=' + optionalParams.unreads;
      }
      else if (optionalParams.unreads === false) {
        url = url + '&unreads=' + false;
      }

    }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get(url, null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public me() {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get('me', null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public logout() {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get('logout', null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  public loggedIn() {
    this.httpRequestConnector.loggedIn();
  }

  /*
    Add Close Channel
     */
  public closeChannel(roomId) {
    var that = this;
    var data = { "roomId": roomId };
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.close', data, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Remove Leader Channel
     */
  public removeLeaderChannel(roomId, userId) {
    var that = this;
    var leaderData = { "roomId": roomId, "userId": userId }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.removeLeader', leaderData, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Remove Owner Channel
     */
  public removeModeratorChannel(roomId, userId) {
    var that = this;
    var moderatorData = { "roomId": roomId, "userId": userId }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.removeModerator', moderatorData, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Remove Owner Channel
     */
  public removeOwnerChannel(roomId, userId) {
    var that = this;
    var ownerData = { "roomId": roomId, "userId": userId }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.removeOwner', ownerData, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Set Default Channel
     */
  public setDefaultChannel(roomId, isDefault) {
    var channelData = { "roomId": roomId, "default": isDefault }
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.setDefault', channelData, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Set Read Only Channel
     */
  public setReadOnlyChannel(roomId, readOnly) {
    var that = this;
    var channelData = { "roomId": roomId, "readOnly": readOnly }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.setReadOnly', channelData, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Set Users List
     */
  public usersList(data) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get('users.list', data, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Set Users Create
     */
  public userCreate(data): Promise<any> {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('users.create', data, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Set Users Info
     */
  public usersInfo(user_id, userName) {
    var that = this;
    var endpoint;

    if ((user_id?.trim()?.length || 0) > 0) {
      endpoint = 'users.info?userId=' + user_id;
    }
    else {
      endpoint = 'users.info?username=' + userName;
    }
    console.info("users.info endpoint: " + endpoint);

    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get(endpoint, null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Set Users Info
     */
  public usersPresence(data) {
    var that = this;
    var userId = data.userId;
    var userName = data.userName;
    var endpoint = 'users.getPresence';

    if ((userName?.trim()?.length || 0) > 0) {
      endpoint = 'users.getPresence?username=' + userName;
    }
    else if ((userId?.trim()?.length || 0) > 0) {
      endpoint = 'users.getPresence?userId=' + userId;
    }
    else {
      endpoint = 'users.getPresence';
    }
    console.info("usersPresence endpoint: " + endpoint);

    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get(endpoint, null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Set Users Set Avatar
     */
  public setAvatar(avatarData) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('users.setAvatar', avatarData, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Set Users delete
     */
  public userDelete(data) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('users.delete', data, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Set Users settings
     */
  public settings() {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get('settings.public', null, false).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Un Archive Channel
     */
  public unArchiveChannel(roomId) {
    var that = this;
    var data = { "roomId": roomId }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('channels.unarchive', data, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Get Integrations of channel
     */
  public getIntegrationChannel(roomId) {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.get('channels.getIntegrations?roomId=' + roomId, null, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Chat Post Message
     */
  public postMessageChat(postMessageData): Promise<any>{
    var that = this;
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('chat.postMessage', postMessageData, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Chat Update Message
     */
  public updateMessageChat(roomId, msgId, msg) {
    var that = this;
    var data = { "roomId": roomId, "msgId": msgId, "text": msg }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('chat.update', data, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }

  /*
    Chat Delete Message
     */
  public deleteMessageChat(roomId, msgId, asUser) {
    var that = this;
    var data = { "roomId": roomId, "msgId": msgId, "asUser": asUser }
    return new Promise(function (resolve, reject) {
      that.httpRequestConnector.post('chat.delete', data, true).then(function (data) {
        var result = JSON.parse(data);
        resolve(result);
      }).catch(function (error) {
        reject(error);
      });
    });
  }
}