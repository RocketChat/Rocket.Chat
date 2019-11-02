![](https://user-images.githubusercontent.com/551004/43643393-884b00a4-9701-11e8-94d8-14c46d1f3660.png)

<h1 align="center">
  The Ultimate Open Source WebChat Platform
</h1>

[![Rocket.Chat](https://open.rocket.chat/images/join-chat.svg)](https://open.rocket.chat/)
[![Build Status](https://img.shields.io/travis/RocketChat/Rocket.Chat/master.svg)](https://travis-ci.org/RocketChat/Rocket.Chat)
[![Project Dependencies](https://david-dm.org/RocketChat/Rocket.Chat.svg)](https://david-dm.org/RocketChat/Rocket.Chat)
[![devDependencies Status](https://david-dm.org/RocketChat/Rocket.Chat/dev-status.svg)](https://david-dm.org/RocketChat/Rocket.Chat?type=dev)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/8580571ba024426d9649e9ab389bd5dd)](https://www.codacy.com/app/RocketChat/Rocket-chat)
[![Coverage Status](https://coveralls.io/repos/RocketChat/Rocket.Chat/badge.svg)](https://coveralls.io/r/RocketChat/Rocket.Chat)
[![Code Climate](https://codeclimate.com/github/RocketChat/Rocket.Chat/badges/gpa.svg)](https://codeclimate.com/github/RocketChat/Rocket.Chat)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/RocketChat/Rocket.Chat/raw/master/LICENSE)


* [**NEW!** Help Wanted](#help-wanted)
* [Community](#community)
* [Mobile Apps](#mobile-apps)
* [Desktop Apps](#desktop-apps)
* [Deployment](#deployment)
   * [Snaps](#instant-server-installation-with-snaps)
   * [DigitalOcean](#digitalocean-droplet)
   * [RocketChatLauncher](#rocketchatlauncher)
   * [Layershift](#layershift)
   * [Yunohost.org](#yunohostorg)
   * [DPlatform](#dplatform)
   * [IndieHosters](#indiehosters)
   * [Ubuntu 16.04](#ubuntu-1604)
   * [Cloudron.io](#cloudronio)
   * [Heroku](#heroku)
   * [Helm Kubernetes](#helm-kubernetes)
  * [Scalingo](#scalingo)
  * [Sloppy.io](#sloppyio)
  * [Docker](#docker)
  * [Ansible](#ansible)
  * [Raspberry Pi 2](#raspberry-pi-2)
  * [Koozali SME](#koozali-sme)
  * [Ubuntu VPS](#ubuntu-vps)
  * [Hyper.sh](#hypersh)
  * [WeDeploy](#wedeploy)
  * [D2C.io](#d2cio)
  * [Syncloud.org](#syncloudorg)
* [About Rocket.Chat](#about-rocketchat)
  * [In the News](#in-the-news)
  * [Features](#features)
  * [Roadmap](#roadmap)
  * [How it all started](#how-it-all-started)
  * [Awards](#awards)
  * [Issues](#issues)
  * [Stack Overflow](#stack-overflow)
  * [Integrations](#integrations)
  * [Documentation](#documentation)
  * [License](#license)
* [Development](#development)
 * [Quick Start](#quick-start-for-code-developers)
  * [Branching Model](#branching-model)
  * [Translations](#translations)
  * [How to Contribute](#how-to-contribute)
* [Credits](#credits)
* [Donate](#donate)

# Help wanted

Rocket.Chat에서는 우리가 할수 있는 모든것을 추진합니다. Rocket.Chat 팀은 확장되는 중이고, 우리는 *바로 여기*만큼 자격을 갖춘 새로운 팀원을 찾을수 있는 좋은 장소가 없다고 생각합니다.

만약 당신이 우리의 프로젝트에 대해 열정이 있고, 작업하고싶은 장소에서 원격으로 일하는 것을 즐기며 세계 최고의 오픈소스팀과 함께 일하고싶다면 우리는 당신과 이야기 해보고싶습니다!

현재 구하는 부분은 다음과 같습니다:

- [수석 보안 연구원 및 개발자](https://rocketchat.recruitee.com/o/lead-security-researcher-and-developer)

- [영업 엔지니어](https://rocketchat.recruitee.com/o/sales-engineer)

- [비즈니스 개발자/영업/방송](https://rocketchat.recruitee.com/o/business-developer-sales-channel)

- [프론트-엔드 개발자](https://rocketchat.recruitee.com/o/frontend-developer)

# Community
전세계 수천명의 회원들이 연중 무휴로 우리의 [커뮤니티 서버]에 가입합니다.(https://open.rocket.chat).

[![Rocket.Chat](https://open.rocket.chat/api/v1/shield.svg?type=channel&name=Rocket.Chat&channel=support)](https://open.rocket.chat/channel/support)일반적인 Rocket.Chat 질문과 함께 우리 커뮤니티로부터 도움을 받는 방법.

[![Rocket.Chat](https://open.rocket.chat/api/v1/shield.svg?type=channel&name=Rocket.Chat&channel=dev)](https://open.rocket.chat/channel/dev) 새로운 기능들을 개발하고자 하는 개발자들을 위한 커뮤니티의 도움

또한 당신은 [Twitter](https://twitter.com/RocketChat)와 [Facebook](https://www.facebook.com/RocketChatApp)을 통해서 대화에 참여할수 있습니다.

# Desktop Apps
[Rocket.Chat.Electron](https://github.com/RocketChat/Rocket.Chat.Electron/releases)에서 Native Cross-Platform Desktop Application을 다운로드 하십시오.

# Mobile Apps

[![Rocket.Chat on Apple App Store](https://user-images.githubusercontent.com/551004/29770691-a2082ff4-8bc6-11e7-89a6-964cd405ea8e.png)](https://itunes.apple.com/us/app/rocket-chat/id1148741252?mt=8) [![Rocket.Chat on Google Play](https://user-images.githubusercontent.com/551004/29770692-a20975c6-8bc6-11e7-8ab0-1cde275496e0.png)](https://play.google.com/store/apps/details?id=chat.rocket.android)  [![](https://user-images.githubusercontent.com/551004/48210349-50649480-e35e-11e8-97d9-74a4331faf3a.png)](https://f-droid.org/en/packages/chat.rocket.android/)

# Deployment

## Instant Server Installation with Snaps

Rocket.Chat을 Linux (Ubuntu 등등)을 이용하여 몇초만에 설치한다:

```
sudo 스냅 설치 rocketchat-서버
```

[![Rocket.Chat Snap은 Linux배포를 권장한다.](https://github.com/Sing-Li/bbug/raw/master/images/ubuntulogo.png)](https://uappexplorer.com/snap/ubuntu/rocketchat-server)

스냅은 매우 빠르게 설치할수 있습니다. 그 명령을 실행함으로써 당신은 완전한 Rocket.Chat 서버 가동 및 실행을 할수 있게됩니다. 스냅은 안전합니다. 그들은 그들의 모든 의존성들로부터 고립되어있습니다. 우리가 새로운 버전을 출시하면, 스냅은 자동 업데이트 됩니다.

우리의 스냅은 무료 SSL 인증서를 요청하고 유지할 수 있는 내장된 역방향 프록시를 특징으로 합니다. 당신은 5분 이내에 공공의 SSL 보안 Rocket.Chat 서버로 갈수있습니다.

우리의 스냅에 대한 더 많은 정보는[here](https://rocket.chat/docs/installation/manual-installation/ubuntu/snaps/)여기서 볼수있습니다.

## DigitalOcean droplet

DigitalOcean Marketplace에서 클릭 한번으로 DigitalOcean droplet에 배포할수 있습니다.

[![do-btn-blue](https://user-images.githubusercontent.com/51996/58146107-50512580-7c1a-11e9-8ec9-e032ba387c2a.png)](https://marketplace.digitalocean.com/apps/rocket-chat?action=deploy&refcode=1940fe28bd31)


## Layershift

차세대 자동 확장 PaaS에서 무료로 Rocket.Chat 서버를 즉시 배치하십시오.

[![Layershift Hosting](https://github.com/Sing-Li/bbug/raw/master/images/layershift.png)](http://jps.layershift.com/rocketchat/deploy.html)

괴롭지 않은 SSL. 당신의 서버 클러스터 사용 수요에 맞게 자동으로 바탕을 확장합니다.

## Yunohost.org
단 몇초만에 당신만의 Rocket.Chat 서버를 host하십시오.

[![YunoHost와 함께 RocketChat 설치](https://install-app.yunohost.org/install-with-yunohost.png)](https://install-app.yunohost.org/?app=rocketchat)

## DPlatform

Linux machine, VM 혹은 VPS에서 바로 실행할수 있는 Rocket.Chat 서버를 설치하는 가장 쉬운 방법

[![DP deploy](https://raw.githubusercontent.com/DFabric/DPlatform-ShellCore/images/logo.png)](https://dfabric.github.io/DPlatform-ShellCore)

## IndieHosters
"서비스 형"으로 host되는 당신의 Rocket.Chat 객체를 얻으십시오. 당신이 등록하면 당신을 위해 우리가 관리해주겠습니다! (업데이트, 백업 등등 ...).

[![Rocket.Chat on IndieHosters](https://indie.host/signup.png)](https://indiehosters.net/shop/product/rocket-chat-21)

## Ubuntu 16.04
[![Ubuntu Apps Explorer](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/uappexplorer.png)](https://uappexplorer.com/snap/ubuntu/rocketchat-server)

셸에서 배포:

`rocketchat-서버 스냅 설치`

30초 이내에, 당신의 Rocket.Chat 서버가 `http://host-ip:3000` 에서 가동될것입니다.

## Cloudron.io

[Cloudron](https://cloudron.io) 에서 Rocket.Chat 설치. 스마트 서버:

[![Install](https://cloudron.io/img/button.svg)](https://cloudron.io/button.html?app=chat.rocket.cloudronapp)

## Heroku
당신의 Rocket.Chat 서버를 [One-Click Deploy](https://heroku.com/deploy)로 **무료** host하십시오.

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/RocketChat/Rocket.Chat/tree/master)

## Helm Kubernetes
공식 [helm chart](https://github.com/helm/charts/tree/master/stable/rocketchat).를 사용하여 Kubernets에 구축합니다.

## Scalingo
[Scalingo](https://scalingo.com).에서 당신의 Rocket.Chat server를 즉시 구축합니다.

[![Deploy on Scalingo](https://cdn.scalingo.com/deploy/button.svg)](https://my.scalingo.com/deploy?source=https://github.com/RocketChat/Rocket.Chat#master)


## Sloppy.io
당신의 docker container를 [sloppy.io](http://sloppy.io).에서 host하고, 계정을 받아서 [quickstarter](https://github.com/sloppyio/quickstarters/tree/master/rocketchat).를 이용하십시오.


## Docker
[Deploy with docker compose](https://rocket.chat/docs/installation/docker-containers/docker-compose/)

[![Rocket.Chat logo](https://d207aa93qlcgug.cloudfront.net/1.95.5.qa/img/nav/docker-logo-loggedout.png)](https://hub.docker.com/r/rocketchat/rocket.chat/)

또는 우리의 자동 빌드 이미지인 [most recent release](https://hub.docker.com/r/rocketchat/rocket.chat/)를 사용합니다.

```
docker pull rocketchat/rocket.chat:latest
```

또는 특정 releases를 선택합니다. ([details of releases available](https://github.com/RocketChat/Rocket.Chat/releases)):
```
docker pull rocketchat/rocket.chat:vX.X.X
```

또는 Docker에서 승인한 최신 안정 릴리스 빌드를 포함하고있는 우리의 [official docker registry image](https://hub.docker.com/_/rocket.chat/):

```
docker pull rocket.chat
```

## Ansible
RHEL / CentOS 7 or Ubuntu 14.04 LTS / 15.04.를 위해서 production급 구축 자동화를 몇분 안에 합니다.

[![Ansible deployment](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/ansible.png)](https://rocket.chat/docs/installation/automation-tools/ansible/)

## Raspberry Pi 2
Rocket.Chat은 세계에서 가장 유명한 30달러 쿼드코어 서버에서 실행됩니다.

[![Raspberry Pi 2](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/pitiny.png)](https://github.com/RocketChat/Rocket.Chat.RaspberryPi)

## Koozali SME

오늘날 세계에서 가장 유명한 소규모 기업용 서버에 Rocket.Chat을 추가하십시오.

[![Koozali SME](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/koozali.png)](https://wiki.contribs.org/Rocket_Chat)

## Ubuntu VPS
이것을 따라라. [deployment instructions](https://rocket.chat/docs/installation/manual-installation/ubuntu/).

## Hyper.sh
[deployment instructions](https://rocket.chat/docs/installation/paas-deployments/hyper-sh/) 에 초당 청구된 Rocket.Chat 인스턴스를 설치하려면 [Hyper.sh](https://rocket.chat/docs/installation/paas-deployments/hyper-sh/).를 따르십시오.

## WeDeploy
Rocket.Chat을 [WeDeploy](https://wedeploy.com) 에서 설치한다:

[![Deploy](https://cdn.wedeploy.com/images/deploy.svg)](https://console.wedeploy.com/deploy?repo=https://github.com/wedeploy-examples/rocketchat-example)

## D2C.io
[D2C](https://d2c.io/).를 사용하여 서버에 Rocket.Chat 스택 배포. 한 번의 클릭으로 확장, 실시간 로그 및 메트릭 확인:

[![Deploy](https://github.com/mastappl/images/blob/master/deployTo.png)](https://panel.d2c.io/?import=https://github.com/d2cio/rocketchat-stack/archive/master.zip/)

## Syncloud.org
사용하기 쉬운 개인 기기에서 Rocket.Chat를 실행하십시오.

[![Deploy](https://syncloud.org/images/logo_min.svg)](https://syncloud.org)

# About Rocket.Chat

Rocket.Chat은 JavaScript에서 [Meteor](https://www.meteor.com/install) 풀스택 프레임워크를 사용하여 개발된 Web Chat Server이다.

그것은 그들만의 채팅 서비스를 개인적으로 주최하기를 원하는 지역사회와 회사들 또는 그들만의 채팅 플랫폼을 만들고 발전시키기를 원하는 개발자들을 위한 훌륭한 솔루션입니다.

## In the News

##### [Wired](http://www.wired.com/2016/03/open-source-devs-racing-build-better-versions-slack/)
> 더 나은 슬랙 버전 구축을 위한 오픈 소스 경주
##### [Hacker News](https://news.ycombinator.com/item?id=9624737)
> 네, 1위까지 올라갔었죠.
##### [Product Hunt](https://www.producthunt.com/tech/rocket-chat)
> 당신만의 Chat같은 오픈소스 슬랙

##### [JavaScript Weekly](http://javascriptweekly.com/issues/234)
> 전체 스택 자바스크립트 개발 플랫폼인 Metore를 사용하여 구축된 오픈 소스 웹 기반 채널 기반 채팅 시스템(a la slack).

##### [Open Source China](http://www.oschina.net/p/rocket-chat)
> Rocket.Chat 是特性最丰富的 Slack 开源替代品之一。 主要功能：群组聊天，直接通信，私聊群，桌面通知，媒体嵌入，链接预览，文件上传，语音/视频 聊天，截图等等。

##### [wwwhatsnew.com](http://wwwhatsnew.com/2015/05/30/rocket-chat-para-los-programadores-que-quieran-ofrecer-un-chat-en-su-web/)
> Para los programadores que quieran ofrecer un chat en su web

##### [clasesdeperiodismo.com](http://www.clasesdeperiodismo.com/2015/05/30/un-chat-de-codigo-abierto-que-puedes-anadir-a-la-web/)
> Un chat de código abierto que puedes añadir a la web

##### [snowulf.com](https://snowulf.com/2015/09/25/why-slack-when-you-can-rocket-chat/)
> 왜 Rocket.chat을 할수 있는데 슬랙?

##### [liminality.xyz](http://liminality.xyz/self-hosting/)
> 인기 있는 클라우드 서비스에 대한 자체 호스팅 대안


## 기능들

- BYOS (Bring Your Own Server)
- Multiple Rooms
- Direct Messages
- Private Groups
- Public Channels
- Desktop Notifications
- Mentions
- Avatars
- Markdown
- Emojis
- Custom Emojis
- Reactions
- One touch Geolocation
- TeX Math Rendering - inline math typesetting
- Media Embeds
- Link Previews
- Sent Message Edit and Deletion
- Transcripts / History
- File Upload / Sharing
- Scalable file sharing - S3 uploads with CDN downloads
- Full text search
- Global search (from all channels/rooms at once)
- Live chat / Messaging call center
- LDAP Authentication
- CAS 1.0, 2.0 support for educational institutions and hosting providers worldwide
- Support for Okta SSO through SAML v2
- I18n - Supports 22 Languages
- Hubot Friendly
- (Beta) Face to Face Video Conferencing (aka WebRTC )
- (Beta) Multi-users Video Group Chat
- (Beta) Jitsi integration
- Audio calls
- Multi-users Audio Conference
- Screen sharing
- Drupal 7.x and 8.x Plug-in (both stable and development flavours) ([download](https://www.drupal.org/project/rocket_chat)  and [source code](https://git.drupal.org/project/rocket_chat.git) )
- XMPP bridge ([try it](https://open.rocket.chat/channel/general))
- REST APIs
- Remote Video Monitoring
- Native real-time APIs for Microsoft C#, Visual Basic, F# and other .NET supported languages ([Get it!](https://www.nuget.org/packages/Rocket.Chat.Net/0.0.12-pre))
- API access from [Perl](https://metacpan.org/pod/Net::RocketChat) and [Java](https://github.com/baloise/rocket-chat-rest-client)  (community contributions)
- Chat-ops powered by Hubot: scalable horizontal app integration (early access)
- Massively scalable hosting and provisioning (beta testing now)
- Native Cross-Platform Desktop Application [Windows, macOS, or Linux](https://rocket.chat/)
- Mobile app for iPhone, iPad, and iPod touch [Download on App Store](https://geo.itunes.apple.com/us/app/rocket-chat/id1148741252?mt=8)
- Mobile app for Android phone, tablet, and TV stick [Available now on Google Play](https://play.google.com/store/apps/details?id=chat.rocket.android)
- Available on [Cloudron Store](https://cloudron.io/appstore.html#chat.rocket.cloudronapp)

## 로드맵

계획한 내용에 대한 최신 보기를 보려면 [milestones](https://github.com/RocketChat/Rocket.Chat/milestones).


## How it all started

[how it all started](https://blog.blackducksoftware.com/rocket-chat-enabling-privately-hosted-chat-services).에 대해 읽어보십시오.

## Awards
[![InfoWorld Bossie Awards 2016 - Best Open Source Applications](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/bossie.png)](http://www.infoworld.com/article/3122000/open-source-tools/bossie-awards-2016-the-best-open-source-applications.html#slide4)

[![Black Duck Open Source Rookie of the Year for 2015](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/blackducksm.png)](https://info.blackducksoftware.com/OpenSourceRookies2015)

[![Softpedia 100% Free and Clean Award for 2017](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/softpedia.gif)](http://www.softpedia.com/get/Internet/Chat/Other-Chat-Tools/Rocket-Chat.shtml#status)

## Issues

[Github Issues](https://github.com/RocketChat/Rocket.Chat/issues)는 로드맵에서 버그와 작업을 추적하는 데 사용됩니다.

## Feature Requests

[Feature Request Forums](https://forums.rocket.chat/c/feature-requests)는 특징 제안을 제안, 토론 및 상향 투표하는 데 사용됩니다.

### Stack Overflow

[Stack Overflow TAG](http://stackoverflow.com/questions/tagged/rocket.chat)를 사용하길 바랍니다.

## Integrations

#### Hubot

Docker 이미지가 준비되었습니다.
이제 모든 사람이 어댑터 코드를 해킹하거나 몇 분 안에 자신의 봇을 가동할 수 있습니다.
자세한 내용은 [Hubot Integration Project](https://github.com/RocketChat/hubot-rocketchat)를 참조하십시오.

#### Chat-ops integrations powered by Hubot

지금 바로 애플리케이션과 플라이인 패널을 통합하십시오! 개발자에게는 조기 접속이 가능합니다.

![Drones Fleet Management System의 샘플 통합](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/dronechatops.png)

#### 많고, 많고 더 많이 올것이다!

경쟁사에 기반한 API를 개발하고 있으니, 계속 채널을 고정하면 여기서 일어나는 많은 일들을 볼수 있을것이다.

## Documentation

[Rocket.Chat documentation](https://rocket.chat/docs/).를 체크해보시오.

## License

Rocket.Chat은 [MIT License](http://opensource.org/licenses/MIT).에 따라 배포된다는것을 주목하시오.

# Development

## Quick start for code developers
전제 조건들 :

* [Git](http://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [Meteor](https://www.meteor.com/install)

> `meteor` 명령을 사용하여 개발 모드에서 앱을 실행할 때 사용할 숨겨진 [NodeJS v8](https://nodejs.org/download/release/v8.9.3/), [Python v2.7](https://www.python.org/downloads/release/python-270/), [MongoDB v3.6](https://www.mongodb.com/mongodb-3.6)를 자동으로 설치한다.

이제 어플리케이션을 복제하고 시작하시오:

```sh
git clone https://github.com/RocketChat/Rocket.Chat.git
cd Rocket.Chat
meteor npm install
meteor npm start
```

서버 파트를 디버깅하려면  [meteor debugging](https://docs.meteor.com/commandline.html#meteordebug).를 사용하십시오. 최상의 디버깅 경험을 위해 Chrome을 사용하십시오.

```sh
meteor debug
```
당신은 개발자 콘솔에서 nodejs 아이콘을 찾을수 있습니다.

당신이 개발자가 아닌, 서버 실행을 원하는 사람이라면 - [deployment methods](https://rocket.chat/docs/installation/paas-deployments/).를 보면 됩니다.

## Branching Model

[Branches and Releases](https://rocket.chat/docs/developer-guides/branches-and-releases/)를 읽어보십시오.

 [Gitflow Workflow](http://nvie.com/posts/a-successful-git-branching-model/)에 기초하고 있으며, 아래 참조 섹션은 nvie의 Vincent Driessen에서 얻은 것입니다.

세부사항은 [Git Workflows Comparison](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)를 읽어보십시오.

## Translations
우리는 [Lingohub](https://translate.lingohub.com/rocketchat/dashboard)로 실험을 하고 있습니다. 
도움이 필요하면 rocket.chat에 e-메일을 보내 번역 프로젝트에 초대하십시오.

## How to Contribute

이미 JavaScript 개발자인가요? Meteor에 친숙한가요? [Pick an issue](https://github.com/RocketChat/Rocket.Chat/labels/contrib%3A%20easy), 
PR을 push하여 즉시 Rocket.Chat의 국제 기부자 공동체의 일원이 되십시오. 더 많은 정보를 얻고싶다면, 우리의 [Contributing Guide](.github/CONTRIBUTING.md) 와 [Official Documentation for Contributors](https://rocket.chat/docs/contributing/)를 읽어보십시오.

많은 작업들이 이미 Rocket.Chat에 들어갔지만, 우리는 그것에 대한 더 큰 계획을 가지고 있습니다!

### Contributor License Agreement

https://cla-assistant.io/RocketChat/Rocket.Chat 에서 우리의 CLA를 검토하고 가입해주세요.

# Credits

우리의 핵심 팀에게 감사를 표합니다.
[Aaron Ogle](https://github.com/geekgonecrazy),
[Bradley Hilton](https://github.com/Graywolf336),
[Diego Sampaio](https://github.com/sampaiodiego),
[Gabriel Engel](https://github.com/engelgabriel),
[Marcelo Schmidt](https://github.com/marceloschmidt),
[Rodrigo Nascimento](https://github.com/rodrigok),
[Sing Li](https://github.com/Sing-Li),
그리고 수백명의 멋진 [contributors](https://github.com/RocketChat/Rocket.Chat/graphs/contributors).

![JoyPixels](https://i.imgur.com/OrhYvLe.png)

이모티콘은 감사하게도 [JoyPixels](https://www.joypixels.com/)로부터 제공되었습니다.

![BrowserStack](https://cloud.githubusercontent.com/assets/1986378/24772879/57d57b88-1ae9-11e7-98b4-4af824b47933.png)

[BrowserStack](https://www.browserstack.com)으로 테스트 해보세요.



# Donate

Rocket.Chat은 영원히 자유롭겠지만, 당신은 우리가 발전 속도를 높일 수 있도록 도와줄 수 있습니다!

[![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=9MT88JJ9X4A6U&source=url)


[BountySource](https://www.bountysource.com/teams/rocketchat)
