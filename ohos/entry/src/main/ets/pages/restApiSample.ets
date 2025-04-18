/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import prompt from '@system.prompt';
import {RestAPI} from '@ohos/rocketchat';
import {PageData,VisitorInfo,CustomFields,VisitorStatus,Data,
  OptionalParams,CustomField,PostMessageData,AvatarData,OnClickUsersListData,OnClickUsersCreate} from "./RestApiSamepleEntity"

let restAPI:RestAPI = new RestAPI("", "", "");

let authToken:string = "";
let rid:string = "";
let userId:string = "";
let channelId:string = "";
let roomName:string = "";
let groupID:string = "";
let messageId:string = "";
let user_id:string = "";
let channelName:string = "";
let otherUserId:string = "LnxXdiShd3WTLovPa"; // Create a new user or get list of user, put the desired user id.
class OnClickUserDeleteData{
  userId ?: string = "";
  username ?: string = "";
  confirmRelinquish ?: boolean = false
}

class OnClickUsersPresenceData{
  userId ?: string = "";
  userName?: string = ""
}
@Entry
@Component
struct Index {
  scroller: Scroller = new Scroller();
  @State email: string = '';
  @State userPassword: string = '';
  @State userName: string = '';
  @State presenceUserId: string = '';
  @State createUserName: string = '';
  @State createUserPreferredName: string = '';
  @State createUserEmail: string = '';
  @State createUserPassword: string = '';
  @State visitorName: string = '';
  @State visitorEmail: string = '';
  @State visitorToken: string = '';
  @State visitorPhone: string = '';
  @State visitorAddress: string = '';
  @State channelName: string = '';
  @State groupName: string = '';

  build() {
    Stack({ alignContent: Alignment.TopStart }) {
      Scroll(this.scroller) {
        Flex({ wrap: FlexWrap.Wrap }) {

          TextInput({ placeholder: 'Username' })
            .type(InputType.Normal)
            .placeholderColor(Color.Blue)
            .placeholderFont({ size: 40, weight: FontWeight.Normal, family: "sans-serif", style: FontStyle.Normal })
            .enterKeyType(EnterKeyType.Next)
            .caretColor(Color.Green)
            .width('90%')
            .height(60)
            .maxLength(20)
            .margin(5)
            .onChange((value: string) => {
              this.email = value
            })

          TextInput({ placeholder: 'Password' })
            .type(InputType.Password)
            .placeholderColor(Color.Blue)
            .placeholderFont({ size: 40, weight: FontWeight.Normal, family: "sans-serif", style: FontStyle.Normal })
            .enterKeyType(EnterKeyType.Next)
            .caretColor(Color.Green)
            .width('90%')
            .height(60)
            .maxLength(20)
            .margin(5)
            .onChange((value: string) => {
              this.userPassword = value
            })

          Column() {
            Text("Login!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickLogin();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("LoginWithAuthToken!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickLoginWithAuthToken();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Me!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickMe();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Users List!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickUsersList();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("User's Info!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickUsersInfo();
              })
          }.margin(5).align(Alignment.Center);


          TextInput({ placeholder: 'Username' })
            .type(InputType.Normal)
            .placeholderColor(Color.Blue)
            .placeholderFont({ size: 40, weight: FontWeight.Normal, family: "sans-serif", style: FontStyle.Normal })
            .enterKeyType(EnterKeyType.Next)
            .caretColor(Color.Green)
            .width('90%')
            .height(60)
            .maxLength(20)
            .margin(5)
            .onChange((value: string) => {
              this.userName = value
            })

          TextInput({ placeholder: 'User Id' })
            .type(InputType.Normal)
            .placeholderColor(Color.Blue)
            .placeholderFont({ size: 40, weight: FontWeight.Normal, family: "sans-serif", style: FontStyle.Normal })
            .enterKeyType(EnterKeyType.Next)
            .caretColor(Color.Green)
            .width('90%')
            .height(60)
            .maxLength(20)
            .margin(5)
            .onChange((value: string) => {
              this.presenceUserId = value
            })

          Column() {
            Text("User's Presence!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickUsersPresence();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("User Set Avatar!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickUserSetAvatar();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Settings!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickSettings();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Page Visited!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickPageVisited();
              })
          }.margin(5).align(Alignment.Center);


          TextInput({ placeholder: 'Visitor Name' })
            .type(InputType.Normal)
            .placeholderColor(Color.Blue)
            .placeholderFont({ size: 40, weight: FontWeight.Normal, family: "sans-serif", style: FontStyle.Normal })
            .enterKeyType(EnterKeyType.Next)
            .caretColor(Color.Green)
            .width('90%')
            .height(60)
            .maxLength(20)
            .margin(5)
            .inputFilter('^[a-zA-Z0-9]+$',(e) => {
              this.showToast(getContext(this).resourceManager.getStringSync($r('app.string.only_numbers_and_English').id))
            })
            .onChange((value: string) => {
              this.visitorName = value
            })

          TextInput({ placeholder: 'Visitor Email(optional)' })
            .type(InputType.Normal)
            .placeholderColor(Color.Blue)
            .placeholderFont({ size: 30, weight: FontWeight.Normal, family: "sans-serif", style: FontStyle.Normal })
            .enterKeyType(EnterKeyType.Next)
            .caretColor(Color.Green)
            .width('90%')
            .height(60)
            .maxLength(20)
            .margin(5)
            .onChange((value: string) => {
              this.visitorEmail = value
            })

          TextInput({ placeholder: 'Visitor Token(optional)' })
            .type(InputType.Normal)
            .placeholderColor(Color.Blue)
            .placeholderFont({ size: 30, weight: FontWeight.Normal, family: "sans-serif", style: FontStyle.Normal })
            .enterKeyType(EnterKeyType.Next)
            .caretColor(Color.Green)
            .width('90%')
            .height(60)
            .maxLength(20)
            .margin(5)
            .onChange((value: string) => {
              this.visitorToken = value
            })

          TextInput({ placeholder: 'Phone(optional)' })
            .type(InputType.Number)
            .placeholderColor(Color.Blue)
            .placeholderFont({ size: 30, weight: FontWeight.Normal, family: "sans-serif", style: FontStyle.Normal })
            .enterKeyType(EnterKeyType.Next)
            .caretColor(Color.Green)
            .width('90%')
            .height(60)
            .maxLength(20)
            .margin(5)
            .onChange((value: string) => {
              this.visitorPhone = value
            })


          TextInput({ placeholder: 'Address(optional)' })
            .type(InputType.Normal)
            .placeholderColor(Color.Blue)
            .placeholderFont({ size: 30, weight: FontWeight.Normal, family: "sans-serif", style: FontStyle.Normal })
            .enterKeyType(EnterKeyType.Next)
            .caretColor(Color.Green)
            .width('90%')
            .height(60)
            .maxLength(20)
            .margin(5)
            .onChange((value: string) => {
              this.visitorAddress = value
            })

          Column() {
            Text("Visitor Registration!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickVisitorRegistration();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Retrieve Visitor!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickRetrieveVisitor();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Set Visitor Status!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickSetVisitorStatus();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Visitor Delete!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickVisitorDelete();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Banners End Point!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickBannersEndPoint();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Get Banners!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGetBanners();
              })
          }.margin(5).align(Alignment.Center);


          TextInput({ placeholder: 'Channel Name' })
            .type(InputType.Normal)
            .placeholderColor(Color.Blue)
            .placeholderFont({ size: 40, weight: FontWeight.Normal, family: "sans-serif", style: FontStyle.Normal })
            .enterKeyType(EnterKeyType.Next)
            .caretColor(Color.Green)
            .width('90%')
            .height(60)
            .maxLength(20)
            .margin(5)
            .inputFilter('^[a-zA-Z0-9]+$',(e) => {
              this.showToast(getContext(this).resourceManager.getStringSync($r('app.string.only_numbers_and_English').id))
            })
            .onChange((value: string) => {
              this.channelName = value
            })

          Column() {
            Text("Create Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickCreateChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Channel Post Message!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickPostMessageChat();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Channel Update Message!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickUpdateMessageChat();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Channel Delete Message!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickDeleteMessageChat();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Invite Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickInviteChannel();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Add Leader Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickAddLeaderChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Remove Leader Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickRemoveLeaderChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Add Moderator Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickAddModeratorChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Remove Moderator Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickRemoveModeratorChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Add Owner Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickAddOwnerChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Remove Owner Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickRemoveOwnerChannel();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Set Channel Purpose!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickSetPurposeChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Set Read Only Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickSetReadOnlyChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Archive Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickArchiveChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("UnArchive Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickUnArchiveChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Counter Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickCounterChannel();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Files Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickFilesChannel();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Get History Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickHistoryChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Info Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickInfoChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Join Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickJoinChannel();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Kick Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickKickChannel();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("List Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickListChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Join List Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickJoinListChannel();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Members Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickMembersChannel();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Online Channel Users!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickOnlineChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("User All Mention By Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGetUserAllMentionByChannel();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Rename Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickRenameChannel();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Roles Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickRolesChannel();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Set Announcement Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickSetAnnouncementChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Set Join Code Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickSetJoinCodeChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Set Channel Topic!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickSetTopicChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Close Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickCloseChannel();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Open Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickOpenChannel();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Get Integrations Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGetIntegrationsChannel();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Set Default Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickSetDefaultChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Leave Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickLeaveChannel();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Delete Channel!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickDeleteChannel();
              })
          }.margin(5).align(Alignment.Center);

          TextInput({ placeholder: 'Group Name' })
            .type(InputType.Normal)
            .placeholderColor(Color.Blue)
            .placeholderFont({ size: 40, weight: FontWeight.Normal, family: "sans-serif", style: FontStyle.Normal })
            .enterKeyType(EnterKeyType.Next)
            .caretColor(Color.Green)
            .width('90%')
            .height(60)
            .maxLength(20)
            .margin(5)
            .inputFilter('^[a-zA-Z0-9]+$',(e) => {
              this.showToast(getContext(this).resourceManager.getStringSync($r('app.string.only_numbers_and_English').id))
            })
            .onChange((value: string) => {
              this.groupName = value
            })

          Column() {
            Text("Create a Group!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupCreate();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group Add All!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupAddAll();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group Invite!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupInvite();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group Add Moderator!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupAddModerator();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Group Remove Moderator!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupRemoveModerator();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Add Owner!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupAddOwner();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group Remove Owner!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupRemoveOwner();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group Info!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupInfo();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group List!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupList();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Set Description!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickSetDescription();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group History!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupHistory();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Set Purpose!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickSetPurpose();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Set Topic!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickSetTopic();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Group Close!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupClose();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group Open!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupOpen();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group Rename!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupRename();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group Kick!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupKick();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group Archive!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupArchive();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group Integrations!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupIntegrations();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group UnArchive!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupUnArchive();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group Leave!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupLeave();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group Set ReadOnly!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickSetReadOnly();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Group Add Leader!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupAddLeader();
              })
          }.margin(5).align(Alignment.Center);


          Column() {
            Text("Delete Group!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickGroupDelete();
              })
          }.margin(5).align(Alignment.Center);

          Column() {
            Text("Logout!!")
              .width('90%')
              .height(40)
              .backgroundColor(0x5733FF)
              .textAlign(TextAlign.Center)
              .fontColor(Color.White)
              .fontSize('22vp')
              .onClick(() => {
                this.onClickLogout();
              })
          }.margin(5).align(Alignment.Center);

        }
      }
    }
  }

  onClickLogin() {
    let that = this;
    restAPI = new RestAPI("https://open.rocket.chat/api/v1/", this.email, this.userPassword);
    restAPI.login().then( (data:ESObject) =>  {
      console.info("onClickLogin data:" + JSON.stringify(data));
      authToken = data.data.authToken;
      userId = data.data.userId;
      console.info("authToken data:" + authToken);
      console.info("authToken userId:" + userId);
      that.showToast("Success");
    }).catch ((error:string) =>  {
      that.showToast("Error :" + error);
      console.info("onClickLogin error:" + error);
    });
  }

  onClickLoginWithAuthToken() {
    let that = this;
    restAPI.loginWithAuthToken(authToken).then( (data:ESObject) =>  {
      console.info("onClickLogin data:" + JSON.stringify(data));
      authToken = data.data.authToken;
      userId = data.data.userId;
      console.info("authToken data:" + authToken);
      console.info("authToken userId:" + userId);
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("onClickLogin error:" + error);
    });
  }

  onClickMe() {
    let that = this;
    restAPI.me().then( (data:string) =>  {
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
    });
  }


  onClickUsersList() {
    let that = this;
    let data:OnClickUsersListData = { fields: { name: 1, emails: 1 }, query: { active: true, type: { $in: ['user', 'bot'] } } }
    restAPI.usersList(data).then( (data:string) =>  {
      console.info("usersList:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("usersList:" + error);
    });
  }

  onClickUsersCreate() {
    let that = this;
    let data:OnClickUsersCreate = {
      name: that.createUserName,
      email: that.createUserEmail,
      password: that.createUserPassword,
      username: that.createUserPreferredName,
      active: true,
      roles: ['user'],
      joinDefaultChannels: true,
      requirePasswordChange: false,
      sendWelcomeEmail: false,
      verified: false
    }
    restAPI.userCreate(data).then( (data:ESObject) =>  {
      console.info("userCreate:" + JSON.stringify(data));
      user_id = data.user._id;
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("userCreate:" + error);
    });
  }

  onClickPageVisited() {
    let that = this;
    //Add room id from realtime api or after creating channel
    let pageData:PageData = {
      token: authToken,
      rid: "4Eyfj2XLKiRDboAjE",
      pageInfo: {
        change: "url",
        title: "",
        location: {
          href: "https://open.rocket.chat/packages/rocketchat_livechat/assets/demo.html#page-4"
        }
      }
    }

    restAPI.pageVisited(pageData).then( (data:string) =>  {
      console.info("pageData data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("pageData error:" + error);
    });
  }

  onClickVisitorRegistration() {
    let that = this;
    //Add a user defined token
    if(that.visitorName.trim().length == 0) {
      this.showToast(getContext(this).resourceManager.getStringSync($r('app.string.visitor_name_cannot_empty').id))
    } else {
      if(that.visitorPhone.trim().length > 0 && (that.visitorPhone.trim().length != 11 || that.visitorPhone.trim().search("1") != 0)) {
        this.showToast(getContext(this).resourceManager.getStringSync($r('app.string.enter_correct_phone_number').id))
      } else {
        if(that.visitorEmail.trim().length > 0 && that.visitorEmail.search("@") < 0) {
          this.showToast(getContext(this).resourceManager.getStringSync($r('app.string.enter_correct_email').id))
        } else{
          let visitorInfo:VisitorInfo = {
            visitor: {
              name: that.visitorName,
              email: that.visitorEmail,
              token: that.visitorToken,
              phone: that.visitorPhone,
              customFields: [{ key: "address", value: that.visitorAddress, overwrite: true }]
            }
          }
          restAPI.visitorRegistration(visitorInfo).then( (data:string) =>  {
            console.info("visitorRegistration data:" + JSON.stringify(data));
            that.showToast("Success");
          }).catch( (error:string) =>  {
            that.showToast("Error :" + error);
            console.info("visitorRegistration error:" + error);
          });
        }
      }
    }
  }

  onClickRetrieveVisitor() {
    let that = this;
    restAPI.visitor(that.visitorToken).then( (data:string) =>  {
      console.info("visitor data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("visitor error:" + error);
    });
  }

  onClickSetVisitorStatus() {
    let that = this;
    let visitorStatus:VisitorStatus = {
      token: that.visitorToken,
      status: "busy",
    }
    restAPI.setVisitorStatus(visitorStatus).then( (data:string) =>  {
      console.info("visitorStatus data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("visitorStatus error:" + error);
    });
  }

  onClickVisitorDelete() {
    let that = this;
    restAPI.visitorDelete(that.visitorToken).then( (data:string) =>  {
      console.info("visitorDelete data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("visitorDelete error:" + error);
    });
  }

  onClickBannersEndPoint() {
    let that = this;
    //Banner id if not available can pass null, as get bannerId or create banner id not available in api list
    restAPI.bannersEndPoint(null).then( (data:string) =>  {
      console.info("bannersEndPoint data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("bannersEndPoint error:" + error);
    });
  }

  onClickGetBanners() {
    let that = this;
    restAPI.getBanners().then( (data:string) =>  {
      console.info("getBanners data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("getBanners error:" + error);
    });
  }

  onClickCreateChannel() {
    let that = this;
    let readOnly = true;
    if(that.channelName.trim().length == 0) {
      that.showToast(getContext(this).resourceManager.getStringSync($r('app.string.channel_name_cannot_be_empty').id));
    } else {
      restAPI.createChannel(that.channelName, ['userName1', 'userName2'], readOnly).then( (data:ESObject) =>  {
        console.info("createChannel data:" + JSON.stringify(data));
        that.showToast("Success");
      }).catch( (error:string) =>  {
        that.showToast("Error :" + error);
        console.info("createChannel error:" + error);
      });
    }
  }

  onClickAddAllChannel() {
    let that = this;
    let roomID = channelId;
    let activeUsersOnly = true;
    restAPI.addAllChannel(channelId, activeUsersOnly).then( (data:ESObject) =>  {
      console.info("AddAllChannel data:" + JSON.stringify(data));
      let addedUsers:ESObject = data.channel.usernames;
      console.info("AddAllChannel addedUsers:" + addedUsers);
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("AddAllChannel error:" + error);
    });
  }

  onClickInviteChannel() {
    let that = this;
    //Add a userid of another user
    let data:Data = { roomId: channelId, userId: otherUserId }
    restAPI.inviteChannel(data).then( (data:string) =>  {
      console.info("inviteChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("inviteChannel error:" + error);
    });
  }

  onClickAddLeaderChannel() {
    let that = this;
    let leaderData:Data = { roomId: channelId,
      userId: userId }
    restAPI.addLeaderChannel(leaderData).then( (data:string) =>  {
      console.info("addLeaderChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("addLeaderChannel error:" + error);
    });
  }

  onClickAddModeratorChannel() {
    let that = this;
    let moderatorData:Data = { roomId: channelId,
      userId: userId }
    restAPI.addModeratorChannel(moderatorData).then( (data:string) =>  {
      console.info("addModeratorChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("addModeratorChannel error:" + error);
    });
  }

  onClickAddOwnerChannel() {
    let that = this;
    let ownerData:Data = { roomId: channelId,
      userId: otherUserId }
    restAPI.addOwnerChannel(ownerData).then( (data:string) =>  {
      console.info("addOwnerChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("addOwnerChannel error:" + error);
    });
  }

  onClickCounterChannel() {
    let that = this;
    let roomId = "snLhQqKN6NXLEfEey";
    let roomName = "TestRoomName"; //Pass an existing room name
    restAPI.counterChannel(roomId, roomName).then( (data:string) =>  {
      console.info("counterChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("counterChannel error:" + error);
    });
  }

  onClickGetUserAllMentionByChannel() {
    let that = this;
    restAPI.getUserAllMentionByChannel(channelId).then( (data:string) =>  {
      console.info("onClickGetUserAllMentionByChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("onClickGetUserAllMentionByChannel error:" + error);
    });
  }

  onClickFilesChannel() {
    let that = this;
    restAPI.filesChannel(channelId, roomName).then( (data:string) =>  {
      console.info("filesChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("filesChannel error:" + error);
    });
  }

  onClickHistoryChannel() {
    let that = this;
    let inclusive = true;
    let offset = 2;
    let count = 100;
    let unreads = true;
    let sampleDate = "2022-03-29";
    let oldestDate = new Date(sampleDate);
    let oldestUTC = Date.UTC(oldestDate.getUTCFullYear(), oldestDate.getUTCMonth(), oldestDate.getUTCDate(),
      oldestDate.getUTCHours(), oldestDate.getUTCMinutes(), oldestDate.getUTCSeconds());

    let latestDate = new Date();
    let latestUTC = Date.UTC(latestDate.getUTCFullYear(), latestDate.getUTCMonth(), latestDate.getUTCDate(),
      latestDate.getUTCHours(), latestDate.getUTCMinutes(), latestDate.getUTCSeconds());
    let latest = new Date(latestUTC);
    let oldest = new Date(oldestUTC);

    let optionalParams:OptionalParams= {
      latest: latest.toISOString(),
      oldest: oldest.toISOString(),
      inclusive: inclusive,
      offset: offset,
      count: count,
      unreads: unreads
    }
    restAPI.historyChannel(channelId, optionalParams).then( (data:string) =>  {
      console.info("historyChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("historyChannel error:" + error);
    });
  }

  onClickInfoChannel() {
    let that = this;
    let roomOptionalId = undefined;
    restAPI.infoChannel(roomOptionalId, roomName).then( (data:string) =>  {
      console.info("infoChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("infoChannel error:" + error);
    });
  }

  onClickJoinChannel() {
    let that = this;
    let joinCode = "Rocket";
    restAPI.joinChannel(channelId, joinCode).then( (data:string) =>  {
      console.info("joinChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("joinChannel error:" + error);
    });
  }

  onClickKickChannel() {
    let that = this;
    restAPI.kickChannel(channelId, userId).then( (data:string) =>  {
      console.info("kickChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("kickChannel error:" + error);
    });
  }

  onClickLeaveChannel() {
    let that = this;
    restAPI.leaveChannel(channelId).then( (data:string) =>  {
      console.info("leaveChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("leaveChannel error:" + error);
    });
  }

  onClickListChannel() {
    let that = this;
    restAPI.listChannel().then( (data:string) =>  {
      console.info("listChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("listChannel error:" + error);
    });
  }

  onClickJoinListChannel() {
    let that = this;
    restAPI.joinListChannel().then( (data:string) =>  {
      console.info("joinListChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("joinListChannel error:" + error);
    });
  }

  onClickMembersChannel() {
    let that = this;
    let roomOptionalId = undefined;
    restAPI.membersChannel(roomOptionalId, roomName).then( (data:string) =>  {
      console.info("membersChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("membersChannel error:" + error);
    });
  }

  onClickMessageChannel() {
    let that = this;
    restAPI.messageChannel(channelId, roomName).then( (data:string) =>  {
      console.info("messageChannel data:" + JSON.stringify(data));
      that.showToast("Success" + JSON.stringify(data));
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("messageChannel error:" + error);
    });
  }

  onClickOnlineChannel() {
    let that = this;
    restAPI.onlineChannel(channelId).then( (data:string) =>  {
      console.info("onlineChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("onlineChannel error:" + error);
    });
  }

  onClickRenameChannel() {
    let that = this;
    let name = "RenamedChannel2";
    restAPI.renameChannel(channelId, name).then( (data:string) =>  {
      console.info("renameChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("renameChannel error:" + error);
    });
  }

  onClickRolesChannel() {
    let that = this;
    restAPI.rolesChannel(channelId, roomName).then( (data:string) =>  {
      console.info("rolesChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("rolesChannel error:" + error);
    });
  }

  onClickSetAnnouncementChannel() {
    let that = this;
    let announcement = "hello";
    restAPI.setAnnouncementChannel(channelId, announcement).then( (data:string) =>  {
      console.info("setAnnouncementChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("setAnnouncementChannel error:" + error);
    });
  }

  onClickSetCustomFieldsChannel() {
    let that = this;
    let customField:CustomField = { organization: "tra-la-la" };
    // channelId can be replaced as first parameter instead of undefined in below api call
    restAPI.setCustomFieldsChannel(undefined, roomName, customField).then( (data:string) =>  {
      console.info("setCustomFieldsChannel data:" + JSON.stringify(data));
      that.showToast("Success" + JSON.stringify(data));
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("setCustomFieldsChannel error:" + error);
    });
  }

  onClickSetJoinCodeChannel() {
    let that = this;
    let joinCode = "test";
    restAPI.setJoinCodeChannel(channelId, joinCode).then( (data:string) =>  {
      console.info("setJoinCodeChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("setJoinCodeChannel error:" + error);
    });
  }

  onClickSetPurposeChannel() {
    let that = this;
    let purpose = "test";
    restAPI.setPurposeChannel(channelId, purpose).then( (data:string) =>  {
      console.info("setPurposeChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("setPurposeChannel error:" + error);
    });
  }

  onClickSetTopicChannel() {
    let that = this;
    let topic = "Test";
    restAPI.setTopicChannel(channelId, topic).then( (data:string) =>  {
      console.info("setTopicChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("setTopicChannel error:" + error);
    });
  }

  onClickSetTypeChannel() {
    let that = this;
    let channelType = "p";
    restAPI.setTypeChannel(channelId, roomName, channelType).then( (data:string) =>  {
      console.info("setTypeChannel data:" + JSON.stringify(data));
      that.showToast("Success" + JSON.stringify(data));
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("setTypeChannel error:" + error);
    });
  }

  onClickArchiveChannel() {
    let that = this;
    restAPI.archiveChannel(channelId).then( (data:string) =>  {
      console.info("archiveChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("archiveChannel error:" + error);
    });
  }

  onClickDeleteChannel() {
    let that = this;
    restAPI.deleteChannel(channelId, roomName).then( (data:string) =>  {
      console.info("deleteChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("deleteChannel error:" + error);
    });
  }

  onClickCloseChannel() {
    let that = this;
    restAPI.closeChannel(channelId).then( (data:string) =>  {
      console.info("closeChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("closeChannel error:" + error);
    });
  }

  onClickOpenChannel() {
    let that = this;
    restAPI.openChannel(channelId).then( (data:string) =>  {
      console.info("OpenChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("OpenChannel error:" + error);
    });
  }

  onClickRemoveLeaderChannel() {
    let that = this;
    restAPI.removeLeaderChannel(channelId, userId).then( (data:string) =>  {
      console.info("removeLeaderChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("removeLeaderChannel error:" + error);
    });
  }

  onClickRemoveModeratorChannel() {
    let that = this;
    restAPI.removeModeratorChannel(channelId, userId).then( (data:string) =>  {
      console.info("removeModeratorChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("removeModeratorChannel error:" + error);
    });
  }

  onClickRemoveOwnerChannel() {
    let that = this;
    restAPI.removeOwnerChannel(channelId, otherUserId).then( (data:string) =>  {
      console.info("removeOwnerChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("removeOwnerChannel error:" + error);
    });
  }

  onClickSetReadOnlyChannel() {
    let that = this;
    let readOnly = false;
    restAPI.setReadOnlyChannel(channelId, true).then( (data:string) =>  {
      console.info("setReadOnlyChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("setReadOnlyChannel error:" + error);
    });
  }

  onClickSetDefaultChannel() {
    let that = this;
    let isDefault = false;
    restAPI.setDefaultChannel(channelId, isDefault).then( (data:string) =>  {
      console.info("setDefaultChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("setDefaultChannel error:" + error);
    });
  }

  onClickUnArchiveChannel() {
    let that = this;
    restAPI.unArchiveChannel(channelId).then( (data:string) =>  {
      console.info("unArchiveChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("unArchiveChannel error:" + error);
    });
  }

  onClickGroupAddLeader() {
    let that = this;
    restAPI.groupAddLeader(groupID, userId).then( (data:string) =>  {
      console.info("group Add Leader data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("group Add Leader error:" + error);
    });
  }

  onClickGroupAddModerator() {
    let that = this;
    restAPI.groupAddModerator(groupID, userId).then( (data:string) =>  {
      console.info("group Add Moderator data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("group Add Moderator error:" + error);
    });
  }

  onClickGroupArchive() {
    let that = this;
    restAPI.groupArchive(groupID).then( (data:string) =>  {
      console.info("groupArchive data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupArchive error:" + error);
    });
  }

  onClickGroupUnArchive() {
    let that = this;
    restAPI.groupUnArchive(groupID).then( (data:string) =>  {
      console.info("groupUnArchive data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupUnArchive error:" + error);
    });
  }

  onClickGroupCreate() {
    let that = this;
    let readOnly = true;
    if(that.groupName.trim().length == 0) {
      this.showToast(getContext(this).resourceManager.getStringSync($r('app.string.group_name_cannot_be_empty').id))
    } else {
      restAPI.groupCreate(that.groupName, ['userName1', 'userName2'], readOnly).then( (data:ESObject) =>  {
        console.info("restApiSample groupCreate data:" + JSON.stringify(data));
        console.info('groupCreate data:' + JSON.stringify(data));
        that.showToast("Success");
      }).catch( (error:string) =>  {
        that.showToast("Error :" + error);
        console.info("groupCreate error:" + error);
      });
    }
  }

  onClickGroupIntegrations() {
    let that = this;
    restAPI.groupIntegrations(groupID).then( (data:string) =>  {
      console.info("groupIntegrations data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupIntegrations error:" + error);
    });
  }

  onClickGroupInvite() {
    let that = this;
    restAPI.groupInvite(groupID, otherUserId).then( (data:string) =>  {
      console.info("groupInvite data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupInvite error:" + error);
    });
  }

  onClickGroupRename() {
    let that = this;
    restAPI.groupRename("DevGroupRename26", groupID).then( (data:string) =>  {
      console.info("groupRename data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupRename error:" + error);
    });
  }

  onClickGroupDelete() {
    let that = this;
    restAPI.groupDelete(groupID, roomName).then( (data:string) =>  {
      console.info("groupDelete data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupDelete error:" + error);
    });
  }

  onClickGroupAddAll() {
    let that = this;
    let activeUsersOnly = true;
    restAPI.groupAddAll(groupID, activeUsersOnly).then( (data:string) =>  {
      console.info("groupAddAll data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupAddAll error:" + error);
    });
  }

  onClickGroupAddOwner() {
    let that = this;
    restAPI.groupAddOwner(groupID, otherUserId).then( (data:string) =>  {
      console.info("groups.addOwner data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groups.addOwner error:" + error);
    });
  }

  onClickGroupRemoveOwner() {
    let that = this;
    restAPI.groupRemoveOwner(groupID, userId).then( (data:string) =>  {
      console.info("groups.removeOwner data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groups.removeOwner error:" + error);
    });
  }

  onClickGroupRemoveModerator() {
    let that = this;
    restAPI.groupRemoveModerator(groupID, userId).then( (data:string) =>  {
      console.info("groupRemoveModerator data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupRemoveModerator error:" + error);
    });
  }

  onClickGroupInfo() {
    let that = this;
    let roomName = undefined;
    restAPI.groupInfo(groupID, roomName).then( (data:string) =>  {
      console.info("groupInfo data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupInfo error:" + error);
    });
  }

  onClickGroupList() {
    let that = this;
    restAPI.groupList().then( (data:string) =>  {
      console.info("groupList data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupList error:" + error);
    });
  }

  onClickGroupHistory() {
    let that = this;
    let inclusive = true;
    let offset = 2;
    let count = 100;
    let unreads = true;
    let sampleDate = "2022-03-29";
    let oldestDate = new Date(sampleDate);
    let oldestUTC = Date.UTC(oldestDate.getUTCFullYear(), oldestDate.getUTCMonth(), oldestDate.getUTCDate(),
      oldestDate.getUTCHours(), oldestDate.getUTCMinutes(), oldestDate.getUTCSeconds());
    let latestDate = new Date();
    let latestUTC = Date.UTC(latestDate.getUTCFullYear(), latestDate.getUTCMonth(), latestDate.getUTCDate(),
      latestDate.getUTCHours(), latestDate.getUTCMinutes(), latestDate.getUTCSeconds());
    let latest = new Date(latestUTC);
    let oldest = new Date(oldestUTC);

    let optionalParams:OptionalParams = {
      latest: latest.toISOString(),
      oldest: oldest.toISOString(),
      inclusive: inclusive,
      offset: offset,
      count: count,
      unreads: unreads
    }
    restAPI.groupHistory(groupID, optionalParams).then( (data:string) =>  {
      console.info("groupHistory data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupHistory error:" + error);
    });
  }

  onClickSetDescription() {
    let that = this;
    restAPI.groupSetDescription(groupID, "SetDescription").then( (data:string) =>  {
      console.info("groupSetDescription data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupSetDescription error:" + error);
    });
  }

  onClickGroupOpen() {
    let that = this;
    restAPI.groupOpen(groupID).then( (data:string) =>  {
      console.info("groupOpen data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupOpen error:" + error);
    });
  }

  onClickGroupClose() {
    let that = this;
    restAPI.groupClose(groupID).then( (data:string) =>  {
      console.info("groupClose data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupClose error:" + error);
    });
  }

  onClickGroupKick() {
    let that = this;
    restAPI.groupKick(groupID, userId).then( (data:string) =>  {
      console.info("groupKick data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupKick error:" + error);
    });
  }

  onClickGroupLeave() {
    let that = this;
    restAPI.groupLeave(groupID).then( (data:string) =>  {
      console.info("groupLeave data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupLeave error:" + error);
    });
  }

  onClickSetPurpose() {
    let that = this;
    restAPI.groupSetPurpose(groupID, "Test out everything").then( (data:string) =>  {
      console.info("groupSetPurpose data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupSetPurpose error:" + error);
    });
  }

  onClickSetReadOnly() {
    let that = this;
    let readOnly = false;
    restAPI.groupSetReadOnly(groupID, false).then( (data:string) =>  {
      console.info("setReadOnly data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("setReadOnly error:" + error);
    });
  }

  onClickSetTopic() {
    let that = this;
    let readOnly = false;
    restAPI.groupSetTopic(groupID, "GroupTopic").then( (data:string) =>  {
      console.info("groupSetTopic data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupSetTopic error:" + error);
    });
  }

  onClickSetType() {
    let that = this;
    restAPI.groupSetType(groupID, 'c').then( (data:string) =>  {
      console.info("groupSetType data:" + JSON.stringify(data));
      that.showToast(JSON.stringify(data));
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("groupSetType error:" + error);
    });
  }

  onClickSettings() {
    let that = this;
    restAPI.settings().then( (data:string) =>  {
      console.info("settings:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("settings :" + error);
      console.info("settings:" + error);
    });
  }



  onClickLogout() {
    let that = this;
    restAPI.logout().then( (data:string) =>  {
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
    });
  }

  onClickPostMessageChat() {
    let postMessageData:PostMessageData = {
      channel: "#" + roomName,
      emoji: ":smirk:",
      roomId: channelId,
      text: "Hello",
      attachments: [
        {
          audio_url: "http://www.w3schools.com/tags/horse.mp3",
          author_icon: "https://avatars.githubusercontent.com/u/850391?v=3",
          author_link: "https://rocket.chat/",
          author_name: "Bradley Hilton",
          collapsed: false,
          color: Color.White,
          fields: [
            {
              short: true,
              title: "Test",
              value: "Testing out something or other"
            },
            {
              short: true,
              title: "Another Test",
              value: "[Link](http://www.w3schools.com) something and this and that."
            }
          ],
          message_link: "http://www.w3schools.com",
          text: "Yay for gruggy!",
          thumb_url: "https://via.placeholder.com/300/09f/fff.png",
          title: "Attachment Example",
          title_link: "http://www.w3schools.com",
          title_link_download: true,
          ts: "2016-12-09T16:53:06.761Z",
          video_url: "http://www.w3schools.com/tags/movie.mp4"
        }
      ]
    }
    let that = this;
    restAPI.postMessageChat(postMessageData).then( (data:ESObject) =>  {
      console.info("postMessageChat data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("logout error:" + error);
    });
  }

  onClickUpdateMessageChat() {
    let that = this;
    restAPI.updateMessageChat(channelId, messageId, "Hello Everyone!!").then( (data:string) =>  {
      console.info("updateMessageChat data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("updateMessageChat error:" + error);
    });
  }

  onClickDeleteMessageChat() {
    let that = this;
    restAPI.deleteMessageChat(channelId, messageId, true).then( (data:string) =>  {
      console.info("deleteMessageChat data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("deleteMessageChat error:" + error);
    });
  }

  onClickUserSetAvatar() {
    let that = this;
    let data:AvatarData = new AvatarData();
    let userName:string = "";
    if ((userName.trim().length || 0) > 0) {
      data = {
        avatarUrl: "https://via.placeholder.com/300/09f/fff.png",
        username: userName
      }
    } else if ((user_id?.trim()?.length || 0) > 0) {
      data = {
        avatarUrl: "https://via.placeholder.com/300/09f/fff.png",
        userId: user_id
      }
    }
    restAPI.setAvatar(data).then( (data:string) =>  {
      console.info("setAvatar:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("setAvatar:" + error);
    });
  }

  onClickGetIntegrationsChannel() {
    let that = this;
    restAPI.getIntegrationChannel(channelId).then( (data:string) =>  {
      console.info("getIntegrationsChannel data:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("getIntegrationsChannel error:" + error);
    });
  }




  onClickUsersInfo() {
    let that = this;
    restAPI.usersInfo(user_id, undefined).then( (data:string) =>  {
      console.info("usersInfo:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("usersInfo:" + error);
    });
  }

  onClickUsersPresence() {
    let that = this;
    let data:OnClickUsersPresenceData = { userId: this.presenceUserId, userName: this.userName }
    restAPI.usersPresence(data).then( (data:string) =>  {
      console.info("usersPresence:" + JSON.stringify(data));
      that.showToast(JSON.stringify(data));
    }).catch( (error:string) =>  {
      that.showToast("Error :" + error);
      console.info("usersPresence:" + error);
    });
  }

  onClickUserDelete() {
    let that = this;
    let data:OnClickUserDeleteData = {};
    let userName = this.userName;
    if ((userName?.trim()?.length || 0) > 0) {
      data = { username: userName, confirmRelinquish: false }
    }
    else if ((user_id?.trim()?.length || 0) > 0) {
      data = { userId: user_id, confirmRelinquish: false }
    }
    restAPI.userDelete(JSON.stringify(data)).then((data:string) =>  {
      console.info("userDelete:" + JSON.stringify(data));
      that.showToast("Success");
    }).catch( (error:string) =>  {
      that.showToast("userDelete :" + error);
      console.info("userDelete:" + error);
    });
  }

  showToast(message:string) {
    prompt.showToast({ message: message, duration: 3000 })
  }
}