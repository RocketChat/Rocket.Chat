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

import {describe, it, expect} from "@ohos/hypium"
import {RestAPI} from '@ohos/rocketchat';
import {PageData,VisitorInfo,CustomFields,VisitorStatus,Data,
  OptionalParams,CustomField,PostMessageData,AvatarData,OnClickUsersListData,OnClickUsersCreate} from "../../../main/ets/pages/RestApiSamepleEntity"

let authToken:string = "";
let rid:string = "";
let userId:string = "";
let membersArray:string[] = []

let email = 'aswin.r';
let emailError = 'aswin.rr';
let password = "mr27293@R";
let passwordError = "mr27293@RR";

let result : boolean = false;
const restAPI = new RestAPI("https://open.rocket.chat/api/v1/", email, password);
const restAPIError = new RestAPI("https://open.rocket.chat/api/v1/", emailError, passwordError);

export default function restApiJsunit() {
  describe('appInfoTest', () => {
    it('app_info_test_001', 0, () => {
      restAPI.login().then((data:ESObject) => {
        authToken = data.data.authToken;
        userId = data.data.userId;
        expect(data.data.userId).assertEqual('eEAHhKshuzpk4XE3F');
      }).catch((error:string) => {
        console.info("onClickLogin error:" + error);
      });
    })

    it('app_info_test_0022', 0, () => {
      restAPI.loginWithAuthToken(authToken).then((data:ESObject) => {
        expect(data).assertEqual(authToken);
      }).catch((error:string) => {
        console.info("onClickLogin error:" + error);
      });
    })

    it('app_info_test_00222', 0, () => {
      restAPI.loginWithAuthToken("").then((data:ESObject) => {
        expect(data).assertEqual("");
      }).catch((error:string) => {
        console.info("onClickLogin error:" + error);
      });
    })

    it('app_info_test_002', 0, () => {
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

      restAPI.pageVisited(pageData).then((data:ESObject) => {
        console.info("pageData data:" + JSON.stringify(data));
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("PageData error:" + error);
      });
    })

    it('app_info_test_040', 0, () => {
      let pageData:PageData = new PageData()
      restAPI.pageVisited(pageData).then((data:ESObject) => {
        console.info("pageData data:" + JSON.stringify(data));
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("PageData error:" + error);
      });
    })

    it('app_info_test_041', 0, () => {
      let pageData = null
      restAPI.pageVisited(pageData).then((data:ESObject) => {
        console.info("pageData data:" + JSON.stringify(data));
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("PageData error:" + error);
      });
    })

    it('app_info_test_042', 0, () => {
      let pageData = undefined
      restAPI.pageVisited(pageData).then((data:ESObject) => {
        console.info("pageData data:" + JSON.stringify(data));
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("PageData error:" + error);
      });
    })

    it('app_info_test_043', 0, () => {
      let pageData:PageData = {
        token: authToken,
      }
      restAPI.pageVisited(pageData).then((data:ESObject) => {
        console.info("pageData data:" + JSON.stringify(data));
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("PageData error:" + error);
      });
    })

    it('app_info_test_002222', 0, () => {
      let pageData:PageData = {
        token: authToken
      }

      restAPI.pageVisited(pageData).then((data:ESObject) => {
        console.info("pageData data:" + JSON.stringify(data));
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("PageData error:" + error);
      });
    })

    it('app_info_test_003', 0, () => {
      let visitorToken = "iNKE8a6k6cjbqWhWT";
      let visitorInfo:VisitorInfo = {
        visitor: {
          name: "TestLivechatVisitorFeb26_1",
          email: "testVisitorFeb26_1@rocket.chat",
          token: visitorToken,
          phone: "77 51 5555-5555",
          customFields: [{
                           key: "address", value: "Rocket.Chat street", overwrite: true
                         }]
        }
      }
      restAPI.visitorRegistration(visitorInfo).then((data:ESObject) => {
        console.info("visitorRegistration data:" + JSON.stringify(data));
        expect(data.visitor.name).assertEqual('TestLivechatVisitorFeb26_1');
      }).catch((error:string) => {
        console.info("visitorRegistration error:" + error);
      });
    })

    it('app_info_test_0044', 0, () => {
      restAPI.visitor(authToken).then((data:ESObject) => {
        console.info("createChannel data:" + JSON.stringify(data));
        expect(data).assertEqual(authToken);
      }).catch((error:string) => {
        console.info("createChannel error:" + error);
      });
    })

    it('app_info_test_00444', 0, () => {
      restAPI.visitor("").then((data:ESObject) => {
        console.info("createChannel data:" + JSON.stringify(data));
        expect(data).assertEqual(authToken);
      }).catch((error:string) => {
        console.info("createChannel error:" + error);
      });
    })

    it('app_info_test_004444', 0, () => {
      let visitorToken = "iNKE8a6k6cjbqWhWT";
      let visitorInfo:VisitorInfo = {
        visitor: {
          name: "TestLivechatVisitorFeb26_1",
          email: "testVisitorFeb26_1@rocket.chat",
          token: visitorToken,
          phone: "77 51 5555-5555",
          customFields: [{
            key: "address", value: "Rocket.Chat street", overwrite: true
          }]
        }
      }
      restAPI.setVisitorStatus(visitorInfo).then((data:ESObject) => {
        console.info("createChannel data:" + JSON.stringify(data));
        expect(data).assertEqual(visitorInfo);
      }).catch((error:string) => {
        console.info("createChannel error:" + error);
      });
    })

    it('app_info_test_004', 0, () => {
      let name = "RocketChannelTest";
      restAPI.createChannel(name, [], true).then((data:ESObject) => {
        console.info("createChannel data:" + JSON.stringify(data));
        expect(data.channel.name).assertEqual('RocketChannelTest');
      }).catch((error:string) => {
        console.info("createChannel error:" + error);
      });
    })

    it('app_info_test_0055', 0, () => {
      let name = "RocketChannelTest";
      restAPI.createChannel(name, [""], true).then((data:ESObject) => {
        console.info("createChannel data:" + JSON.stringify(data));
        expect(data.channel.name).assertEqual('RocketChannelTest');
      }).catch((error:string) => {
        console.info("createChannel error:" + error);
      });
    })

    it('app_info_test_00555', 0, () => {
      let name = "RocketChannelTest";
      restAPI.createChannel(name, ["3"], true).then((data:ESObject) => {
        console.info("createChannel data:" + JSON.stringify(data));
        expect(data.channel.name).assertEqual('RocketChannelTest');
      }).catch((error:string) => {
        console.info("createChannel error:" + error);
      });
    })

    it('app_info_test_005555', 0, () => {
      let name = "RocketChannelTest";
      restAPI.createChannel(name, ["0"], true).then((data:ESObject) => {
        console.info("createChannel data:" + JSON.stringify(data));
        expect(data.channel.name).assertEqual('RocketChannelTest');
      }).catch((error:string) => {
        console.info("createChannel error:" + error);
      });
    })

    it('app_info_test_0055555', 0, () => {
      let name = "RocketChannelTest";
      restAPI.createChannel(name, ["-1"], true).then((data:ESObject) => {
        console.info("createChannel data:" + JSON.stringify(data));
        expect(data.channel.name).assertEqual('RocketChannelTest');
      }).catch((error:string) => {
        console.info("createChannel error:" + error);
      });
    })

    it('app_info_test_005', 0, () => {
      let data:OnClickUsersCreate = {
        name: "test_name",
        email: "email@testuser.tld",
        password: "anypassyouwant",
        username: "uniqueusernametest"
      }
      restAPI.userCreate(data).then((data:ESObject) => {
        expect(data.user.username).assertEqual('uniqueusernametest');
      }).catch((error:string) => {
        console.info("userCreate:" + error);
      });
    })

    it('app_info_test_006', 0, () => {
      restAPI.settings().then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("settings:" + error);
      });
    })

    it('app_info_test_007', 0, () => {
      restAPI.getBanners().then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("getBanners error:" + error);
      });
    })

    it('app_info_test_0077', 0, () => {
      restAPI.bannersEndPoint(null).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("getBanners error:" + error);
      });
    })
    it('app_info_test_00777', 0, () => {
      restAPI.bannersEndPoint(1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("getBanners error:" + error);
      });
    })

    it('app_info_test_007777', 0, () => {
      restAPI.bannersEndPoint(-1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("getBanners error:" + error);
      });
    })

    it('app_info_test_008', 0, () => {
      restAPI.groupCreate("TestDevGroup", membersArray, false).then((data:ESObject) => {
        expect(data.group.name).assertEqual('TestDevGroup');
      }).catch((error:string) => {
        console.info("groupCreate error:" + error);
      });
    })

    it('app_info_test_0088', 0, () => {
      restAPI.groupCreate("", membersArray, false).then((data:ESObject) => {
        expect(data.group.name).assertEqual('');
      }).catch((error:string) => {
        console.info("groupCreate error:" + error);
      });
    })

    it('app_info_test_009', 0, () => {
      restAPI.me().then((data:ESObject) => {
        expect(data).assertEqual('eEAHhKshuzpk4XE3F');
      }).catch((error:string) => {
        console.info("me error:" + error);
      });
    })


    it('app_info_test_010', 0, () => {
      restAPI.groupList().then((data:ESObject) => {
        expect(data).assertEqual('');
      }).catch((error:string) => {
        console.info("me error:" + error);
      });
    })

    it('app_info_test_0101', 0, () => {
      restAPI.groupList().then((data:ESObject) => {
        expect(data).assertEqual(null);
      }).catch((error:string) => {
        console.info("me error:" + error);
      });
    })

    it('app_info_test_011', 0, () => {
      restAPI.logout().then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_012', 0, () => {
      restAPI.logout().then((data:ESObject) => {
        expect(data).assertFalse();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_013', 0, () => {
      restAPI.closeChannel(1).then((data:ESObject) => {
        expect(data).assertFalse();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_014', 0, () => {
      restAPI.closeChannel(0).then((data:ESObject) => {
        expect(data).assertFalse();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_015', 0, () => {
      restAPI.closeChannel(-1).then((data:ESObject) => {
        expect(data).assertFalse();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })
    it('app_info_test_016', 0, () => {
      restAPI.closeChannel("0").then((data:ESObject) => {
        expect(data).assertFalse();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_017', 0, () => {
      restAPI.closeChannel(null).then((data:ESObject) => {
        expect(data).assertFalse();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_018', 0, () => {
      restAPI.closeChannel(undefined).then((data:ESObject) => {
        expect(data).assertFalse();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_019', 0, () => {
      restAPI.closeChannel(1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_020', 0, () => {
      restAPI.closeChannel(0).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_021', 0, () => {
      restAPI.closeChannel(-1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })
    it('app_info_test_022', 0, () => {
      restAPI.closeChannel("0").then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_023', 0, () => {
      restAPI.closeChannel(null).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_024', 0, () => {
      restAPI.closeChannel(undefined).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_044', 0, () => {
      restAPI.removeLeaderChannel(1,1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })
    it('app_info_test_045', 0, () => {
      restAPI.removeLeaderChannel(0,0).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_046', 0, () => {
      restAPI.removeLeaderChannel(-1,-1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_047', 0, () => {
      restAPI.removeLeaderChannel(null,null).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_048', 0, () => {
      restAPI.removeLeaderChannel(undefined,undefined).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_049', 0, () => {
      restAPI.removeModeratorChannel(1,1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_050', 0, () => {
      restAPI.removeModeratorChannel(-1,-1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })
    it('app_info_test_051', 0, () => {
      restAPI.removeModeratorChannel(0,0).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_052', 0, () => {
      restAPI.removeModeratorChannel(undefined,undefined).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_053', 0, () => {
      restAPI.removeModeratorChannel(null,null).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_054', 0, () => {
      restAPI.removeOwnerChannel(null,null).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_055', 0, () => {
      restAPI.removeOwnerChannel(0,0).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_056', 0, () => {
      restAPI.removeOwnerChannel(1,1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_057', 0, () => {
      restAPI.removeOwnerChannel(-1,-1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_058', 0, () => {
      restAPI.removeOwnerChannel(undefined,undefined).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_059', 0, () => {
      restAPI.setDefaultChannel(null,null).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_060', 0, () => {
      restAPI.setDefaultChannel(0,0).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_061', 0, () => {
      restAPI.setDefaultChannel(1,1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_062', 0, () => {
      restAPI.setDefaultChannel(-1,-1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_063', 0, () => {
      restAPI.setDefaultChannel(undefined,undefined).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_064', 0, () => {
      restAPI.setReadOnlyChannel(null,null).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_065', 0, () => {
      restAPI.setReadOnlyChannel(0,0).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_066', 0, () => {
      restAPI.setReadOnlyChannel(1,1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_067', 0, () => {
      restAPI.setReadOnlyChannel(-1,-1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_068', 0, () => {
      restAPI.setReadOnlyChannel(undefined,undefined).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_069', 0, () => {
      restAPI.usersList(null).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_070', 0, () => {
      restAPI.usersList(0).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_071', 0, () => {
      restAPI.usersList(1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_072', 0, () => {
      restAPI.usersList(-1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_073', 0, () => {
      restAPI.usersList(undefined).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_074', 0, () => {
      restAPI.userCreate(null).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_075', 0, () => {
      restAPI.userCreate(0).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_076', 0, () => {
      restAPI.userCreate(1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_077', 0, () => {
      restAPI.userCreate(-1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_078', 0, () => {
      restAPI.userCreate(undefined).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_079', 0, () => {
      restAPI.usersInfo(null,null).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_080', 0, () => {
      restAPI.usersInfo("0","0").then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_081', 0, () => {
      restAPI.usersInfo("1","1").then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_082', 0, () => {
      restAPI.usersInfo("-1","-1").then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_083', 0, () => {
      restAPI.usersInfo(undefined,undefined).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_084', 0, () => {
      restAPI.usersPresence({"userId":null, "userName" :null}).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_085', 0, () => {
      restAPI.usersPresence({"userId":"0", "userName" :"0"}).then((data:ESObject) => {
        console.info("data=======================" +JSON.stringify(data))
        expect(data).assertFail();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_086', 0, () => {
      restAPI.usersPresence({"userId": "1", "userName" :"1"}).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_087', 0, () => {
      restAPI.usersPresence({"userId":"-1", "userName" :"-1"}).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_088', 0, () => {
      restAPI.usersPresence({"userId":undefined, "userName" :undefined}).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_089', 0, () => {
      restAPI.setAvatar(null).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_090', 0, () => {
      restAPI.setAvatar(0).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_091', 0, () => {
      restAPI.setAvatar(1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_092', 0, () => {
      restAPI.setAvatar(-1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_093', 0, () => {
      restAPI.setAvatar(undefined).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_094', 0, () => {
      restAPI.userDelete(null).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_095', 0, () => {
      restAPI.userDelete(0).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_096', 0, () => {
      restAPI.userDelete(1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_097', 0, () => {
      restAPI.userDelete(-1).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_098', 0, () => {
      restAPI.userDelete(undefined).then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_099', 0, () => {
      restAPI.settings().then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_100', 0, () => {
      restAPI.settings().then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_101', 0, () => {
      restAPI.settings().then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_102', 0, () => {
      restAPI.settings().then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })

    it('app_info_test_103', 0, () => {
      restAPI.settings().then((data:ESObject) => {
        expect(data).assertTrue();
      }).catch((error:string) => {
        console.info("logout error:" + error);
      });
    })
  })
}