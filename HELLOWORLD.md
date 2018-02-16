![Rocket.Chat logo](https://rocket.chat/images/logo/logo-dark.svg?v3)

# The Ultimate Open Source WebChat Platform

Welcome to **Hello World**, a contribution and development guide on Rocket.Chat

# **Table Of Contents**

*[Contributing To Rocket.Chat](#contributing)

*[Development Guide](#development)

*[Troubleshooting](#troubleshooting)

# Contributing to Rocket.Chat

### Forking the Repository

Before starting development and contributing to Rocket.Chat, first one needs to know the basics of Git and Github.
The first step towards contributing to Rocket.Chat is knowing how to fork and clone the repository.

* Open the Repository in Github.
* Click on the **Fork** button in the top right corner as shown here ---

![Fork Button](https://help.github.com/assets/images/help/repository/fork_button.jpg)


For more details on forking a repository, visit the [Github Help Pages on Forking a Repository](https://help.github.com/articles/fork-a-repo/)


### Cloning the Repository

For starting developing the app, you first need to create a local copy of the repository in your system ( also known as a clone).
To clone the repository into your system, follow these steps --- 

* On GitHub, navigate to the main page of the repository.

* Under the repository name, click Clone or download.

* In the Clone with HTTPs section, click  to copy the clone URL for the repository.

* Open Git Bash.

* Change the current working directory to the location where you want the cloned directory to be made.

* Type `git clone`, and then paste the URL you copied in Step 2.

`git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY`

* Press Enter. Your local clone will be created.

```
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY
Cloning into `Spoon-Knife`...
remote: Counting objects: 10, done.
remote: Compressing objects: 100% (8/8), done.
remove: Total 10 (delta 1), reused 10 (delta 1)
Unpacking objects: 100% (10/10), done.
```

For more details on cloning, visit the [Github Help Pages on Cloning a Repository](https://help.github.com/articles/cloning-a-repository/)


### Pull Requests

Pull requests let you tell others about changes you've pushed to a repository on GitHub. Once a pull request is opened, you can discuss and review the potential changes with collaborators and add follow-up commits before the changes are merged into the repository


#### Opening Pull Request

* On GitHub, navigate to the main page of the repository.

* In the "Branch" menu, choose the branch that contains your commits.

[!Branch Menu](https://help.github.com/assets/images/help/pull_requests/branch-dropdown.png)

* To the right of the Branch menu, click `New pull request`.

[! New Pull Request](https://help.github.com/assets/images/help/pull_requests/pull-request-start-review-button.png)

* Use the base branch dropdown menu to select the branch you'd like to merge your changes into, then use the compare branch drop-down menu to choose the topic branch you made your changes in.

[! Compare](https://help.github.com/assets/images/help/pull_requests/choose-base-and-compare-branches.png)

* Type a title and description for your pull request.
[! Description for pull request](https://help.github.com/assets/images/help/pull_requests/pullrequest-description.png)

* Click `Create pull request`.

**Note : If you are creating a pull request in a forked repository, you can merge the pull request yourself.

To merge a pull request on a forked repository, 

Click [here](https://help.github.com/articles/creating-a-pull-request-from-a-fork)**

# Development Guide

## Deployement

# Deployment

## Instant Server Installation with Snaps

Install Rocket.Chat in seconds on Linux (Ubuntu and others) with:

```
sudo snap install rocketchat-server
```

[![Rocket.Chat Snap is recommended for Linux deployments](https://github.com/Sing-Li/bbug/raw/master/images/ubuntulogo.png)](https://uappexplorer.com/snap/ubuntu/rocketchat-server)

Installing snaps is very quick.  By running that command you have your full Rocket.Chat server up and running.  Snaps are secure.  They are isolated with all of their dependencies.  Snaps also auto update when we release new versions.

Our snap features a built-in reverse proxy that can request and maintain free letsencrypt SSL certificates. You can go from zero to a public-facing SSL-secured Rocket.Chat server in less than 5 minutes.

Find out more information about our snaps [here](https://rocket.chat/docs/installation/manual-installation/ubuntu/snaps/)

## RocketChatLauncher

Focus on your team/community and not on servers or code - the Launcher provides RocketChat-as-a-Service on a monthly subscription model.

[![RocketChatLauncher](https://rocketchatlauncher.com/wp-content/uploads/2017/03/cropped-rcl-small-type.png)](https://rocketchatlauncher.com)

## Layershift

Instantly deploy your Rocket.Chat server for free on next generation auto-scaling PaaS.

[![Layershift Hosting](https://github.com/Sing-Li/bbug/raw/master/images/layershift.png)](http://jps.layershift.com/rocketchat/deploy.html)

Painless SSL. Automatically scale your server cluster based on usage demand.

## Sandstorm.io
Host your own Rocket.Chat server in four seconds flat:

[![Rocket.Chat on Sandstorm.io](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/sandstorm.jpg)](https://apps.sandstorm.io/app/vfnwptfn02ty21w715snyyczw0nqxkv3jvawcah10c6z7hj1hnu0)

## Yunohost.org
Host your own Rocket.Chat server in a few seconds.

[![Install RocketChat with YunoHost](https://install-app.yunohost.org/install-with-yunohost.png)](https://install-app.yunohost.org/?app=rocketchat)

## DPlatform

Easiest way to install a ready-to-run Rocket.Chat server on a Linux machine, VM, or VPS

[![DP deploy](https://raw.githubusercontent.com/DFabric/DPlatform-ShellCore/gh-pages/img/deploy.png)](https://dfabric.github.io/DPlatform-ShellCore)

## IndieHosters
Get your Rocket.Chat instance hosted in a "as a Service" style. You register and we manage it for you! (updates, backup...)

[![Rocket.Chat on IndieHosters](https://indie.host/signup.png)](https://indiehosters.net/shop/product/rocket-chat-21)

## Ubuntu 16.04
[![Ubuntu Apps Explorer](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/uappexplorer.png)](https://uappexplorer.com/snap/ubuntu/rocketchat-server)

Deploy from shell:

`snap install rocketchat-server`

In under 30 seconds, your Rocket.Chat server will be up and running at `http://host-ip:3000`

## Cloudron.io

Install Rocket.Chat on [Cloudron](https://cloudron.io) Smartserver:

[![Install](https://cloudron.io/img/button.svg)](https://cloudron.io/button.html?app=chat.rocket.cloudronapp)

## Heroku
Host your own Rocket.Chat server for **FREE** with [One-Click Deploy](https://heroku.com/deploy)

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/RocketChat/Rocket.Chat/tree/master)

## Helm Kubernetes
Deploy on Kubernetes using the official [helm chart](https://github.com/kubernetes/charts/pull/752).

## Scalingo
Deploy your own Rocket.Chat server instantly on [Scalingo](https://scalingo.com)

[![Deploy on Scalingo](https://cdn.scalingo.com/deploy/button.svg)](https://my.scalingo.com/deploy?source=https://github.com/RocketChat/Rocket.Chat#master)


## Sloppy.io
Host your docker container at [sloppy.io](http://sloppy.io). Get an account and use the [quickstarter](https://github.com/sloppyio/quickstarters/tree/master/rocketchat)


## Docker
[Deploy with docker compose](https://rocket.chat/docs/installation/docker-containers/docker-compose)

or

Use the automated build image of our [most recent release](https://hub.docker.com/r/rocketchat/rocket.chat/)

[![Rocket.Chat logo](https://d207aa93qlcgug.cloudfront.net/1.95.5.qa/img/nav/docker-logo-loggedout.png)](https://hub.docker.com/r/rocketchat/rocket.chat/)

```
docker pull rocketchat/rocket.chat:latest
```

OR select a specific release ([details of releases available](https://github.com/RocketChat/Rocket.Chat/releases)):
```
docker pull rocketchat/rocket.chat:vX.X.X
```

OR our [official docker registry image](https://hub.docker.com/_/rocket.chat/), containing recent stable release build approved by Docker:

```
docker pull rocket.chat
```

## FreeBSD
Run solid five-nines deployment on industry workhorse FreeBSD server:

[![FreeBSD Daemon](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/freebsd.png)](https://rocket.chat/docs/installation/manual-installation/freebsd/)

## Windows Server

Deploy on your own enterprise server, or with Microsoft Azure:

[![Windows 2012 or 2016 Server](https://github.com/Sing-Li/bbug/blob/master/images/windows.png)](https://rocket.chat/docs/installation/manual-installation/windows-server/)

## Ansible
Automated production-grade deployment in minutes, for RHEL / CentOS 7 or Ubuntu 14.04 LTS / 15.04:

[![Ansible deployment](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/ansible.png)](https://rocket.chat/docs/installation/automation-tools/ansible/)

## Raspberry Pi 2
Run Rocket.Chat on this world famous $30 quad core server:

[![Raspberry Pi 2](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/pitiny.png)](https://github.com/RocketChat/Rocket.Chat.RaspberryPi)

## Koozali SME

Add Rocket.Chat to this world famous time tested small enterprise server today:

[![Koozali SME](https://raw.githubusercontent.com/Sing-Li/bbug/master/images/koozali.png)](https://wiki.contribs.org/Rocket_Chat)

## Ubuntu VPS
Follow these [deployment instructions](https://rocket.chat/docs/installation/manual-installation/ubuntu/)

## Hyper.sh
Follow their [deployment instructions](https://rocket.chat/docs/installation/paas-deployments/hyper-sh/) to install a per-second billed Rocket.Chat instance on [Hyper.sh](https://rocket.chat/docs/installation/paas-deployments/hyper-sh/)

## WeDeploy
Install Rocket.Chat on [WeDeploy](https://wedeploy.com):

[![Install](https://avatars3.githubusercontent.com/u/10002920?v=4&s=100)](https://rocket.chat/docs/installation/paas-deployments/wedeploy/)


# Troubleshooting

### babel-runtime:

If you are having the following error:

```
(STDERR) Error: The babel-runtime npm package could not be found in your node_modules
(STDERR) directory. Please run the following command to install it:
(STDERR)
(STDERR)   meteor npm install --save babel-runtime
(STDERR)
(...)
=> Exited with code: 1
=> Your application is crashing. Waiting for file change.
```

Just install the mentioned package with the following command:

`meteor npm install --save babel-runtime`


### bcrypt:

If you see the following warning in the meteor logs:

```
(STDERR) Note: you are using a pure-JavaScript implementation of bcrypt.
(STDERR) While this implementation will work correctly, it is known to be
(STDERR) approximately three times slower than the native implementation.
(STDERR) In order to use the native implementation instead, run
(STDERR)
(STDERR)   meteor npm install --save bcrypt
(STDERR)
```
Don’t panic =) It means that the bcrypt library is not installed on your system and meteor will use a javascript alternative that is about three times slower.

If you want to install the library to make it faster, use the following command:

`meteor npm install --save bcrypt`
If the version of the python interpreter on your system is greater than v2.5.0 or less than 3.0.0, it should work fine, but, if you see a message like this:

```
gyp ERR! configure error
gyp ERR! stack Error: Python executable "/usr/local/bin/python3" is v3.5.2, which is not supported by gyp.
gyp ERR! stack You can pass the --python switch to point to Python >= v2.5.0 & < 3.0.0.
```

After you are sure that you have a python interpreter that matches the above requirements, use the following command to fix the error:

`meteor npm config set python python2.7`

Build it again:

`meteor npm install --save bcrypt`

If everything works, you should see a message like this:
```
> node-gyp rebuild

  CXX(target) Release/obj.target/bcrypt_lib/src/blowfish.o
  CXX(target) Release/obj.target/bcrypt_lib/src/bcrypt.o
  CXX(target) Release/obj.target/bcrypt_lib/src/bcrypt_node.o
  SOLINK_MODULE(target) Release/bcrypt_lib.node
clang: warning: libstdc++ is deprecated; move to libc++ with a minimum deployment target of OS X 10.9
Rocket.Chat@0.46.0-develop /Users/douglas/work/github/Rocket.Chat
└─┬ bcrypt@0.8.7
  ├── bindings@1.2.1
  └── nan@2.3.5
  ```
  
### Breaking Changes

These are all the breaking changes — that is, changes you absolutely have to worry about. However, we recommend that you also consider the recommended changes listed below.

Click [here](https://guide.meteor.com/1.4-migration.html) to view the list of all the breaking changes in Meteor.

If any of these changes is encountered, the Rocket.Chat Repository needs to be rebuit.



# Donate

Rocket.Chat will be free forever, but you can help us speed-up the development!

[![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=ZL94ZE6LGVUSN)

[![Bitcoins](https://github.com/RocketChat/Rocket.Chat.Docs/blob/master/1.%20Contributing/Donating/coinbase.png?raw=true)](https://www.coinbase.com/checkouts/ac2fa967efca7f6fc1201d46bdccb875)


[BountySource](https://www.bountysource.com/teams/rocketchat)
