![Rocket.Chat logo](https://rocket.chat/images/logo/logo-dark.svg?v3)

# The Ultimate Open Source WebChat Platform

Welcome to Hello World, a comprehensive troubleshooting guide for developers and users, to make the Rocket.Chat experience better.

For more details, visit the Rocket.Chat docs by clicking [*here](https://docs.rocket.chat/)

#**Hello World - a User's Guide on contributing and developing Rocket.Chat

# *Table of Contents*

*[Contribution to Rocket.Chat](#contribution)

*[Development Guide](#development-guide)

*[Testing](#testing)

# Contribution to Rocket.Chat

### How to Contribute?

#### Forking the Repository

1. Open the Repository in Github and Click on the **Fork** Button in the top right corner as shown in the image.
![Fork Button](https://help.github.com/assets/images/help/repository/fork_button.jpg)

#### Keep your fork synced

You might fork a project in order to propose changes to the upstream, or original, repository. In this case, it's good practice to regularly sync your fork with the upstream repository. To do this, you'll need to use Git on the command line. You can practice setting the upstream repository using the same `octocat/Spoon-Knife` repository you just forked!

**Step 1: Set Up Git**


If you haven't yet, you should first set up Git. Don't forget to set up authentication to GitHub from Git as well.


**Step 2: Create a local clone of your fork**

*Right now, you have a fork of the repository, but you don't have the files in that repository on your computer. Let's create a clone of your fork locally on your computer.

*On GitHub, navigate to your fork of the repository.

*Under the repository name, click `Clone` or download.

*In the Clone with HTTPs section,copy the clone URL for the repository.

*Open Terminal.

*Type `git clone`, and then paste the URL you copied in Step 2. It will look like this, with your GitHub username instead of YOUR-USERNAME:

`
`git clone https://github.com/YOUR-USERNAME/Rocket.Chat`
`

*Press Enter. Your local clone will be created.

``

git clone https://github.com/YOUR-USERNAME/Rocket.Chat
Cloning into `Rocket.Chat`...
remote: Counting objects: 10, done.
remote: Compressing objects: 100% (8/8), done.
remove: Total 10 (delta 1), reused 10 (delta 1)
Unpacking objects: 100% (10/10), done.

``
Now, you have a local copy of your fork of the repository!

**Step 3: Configure Git to sync your fork with the original repository**

*When you fork a project in order to propose changes to the original repository, you can configure Git to pull changes from the original, or upstream, repository into the local clone of your fork.

*On GitHub, navigate to the repository.

*Under the repository name, click `Clone` or download.

*In the Clone with HTTPs section,copy the clone URL for the repository.

*Open Terminal.

*Change directories to the location of the fork you cloned in Step 2: Create a local clone of your fork.

*To go to your home directory, type just `cd ` with no other text.
*To list the files and folders in your current directory, type `ls`.
*To go into one of your listed directories, type `cd your_listed_directory`.
*To go up one directory, type `cd ...`
*Type `git remote -v` and press Enter. You'll see the current configured remote repository for your fork.

``
git remote -v
origin  https://github.com/YOUR_USERNAME/YOUR_FORK.git (fetch)
origin  https://github.com/YOUR_USERNAME/YOUR_FORK.git (push)
``
*Type git remote add upstream, and then paste the URL you copied in Step 2 and press Enter. It will look like this:

``
git remote add upstream https://github.com/octocat/Spoon-Knife.git
``
*To verify the new upstream repository you've specified for your fork, type `git remote -v` again. You should see the URL for your fork as origin, and the URL for the original repository as upstream.


```

git remote -v
origin    https://github.com/YOUR_USERNAME/YOUR_FORK.git (fetch)
origin    https://github.com/YOUR_USERNAME/YOUR_FORK.git (push)
upstream  https://github.com/ORIGINAL_OWNER/ORIGINAL_REPOSITORY.git (fetch)
upstream  https://github.com/ORIGINAL_OWNER/ORIGINAL_REPOSITORY.git (push)

```
Now, you can keep your fork synced with the upstream repository with a few Git commands. For more information, see "Syncing a fork."

### How can you make changes into Rocket.Chat?

*Before starting contributing to Rocket.Chat, it is advised to go through the basic commands and usage of Git and Github.
Click **[here](https://help.github.com/)** for help on Github usage.



*After forking and cloning the repository, you can edit individual files in any text editor of your choice, and make changes to the features offered in the Rocket.Chat Platform.

*If you wish to share the changes you have made with other users or if you have solved any pre-existing issue in the build, make sure to push your code to the offficial Rocket.Chat repository by **making a pull request**.

##### How to make a Pull Request?

After you have made changes to your local build of Rocket.Chat, firstly you need to commit and push the new repository into the local repository, in your own account. Then, you need to make a Pull Request to ask for the permission of the administrator to sync your repository with the original build. 

For more information on pull requests, click **[here](https://help.github.com/articles/creating-a-pull-request/)

**Note that after committing changes, the local repository must have just one commit more than the original repository.** 

**Next Steps**

The sky's the limit with the changes you can make to a fork, including:

Creating branches: Branches allow you to build new features or test out ideas without putting your main project at risk.
Opening pull requests: If you are hoping to contribute back to the original repository, you can send a request to the original author to pull your fork into their repository by submitting a pull request.


# Development Guide

## Installation Guide

### Instant Server Installation with Snaps

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

`
snap install rocketchat-server
`

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

# Testing
## Rebuilding your Project

Rebuilding your project is generalling required in case a breaking change occurs. Click [here(https://guide.meteor.com/1.4-migration.html#recommendations)] to view the list of breaking changes in Meteor. 
#Testing

### Requirements

`Google Chrome Browser`

### Getting Started

**Start Meteor**

Run meteor with the command below:

`TEST_MODE=true meteor`

To run the tests, the server *must* be started with the environment variable `TEST_MODE=true`. This will set all animations’ duration to 0 and create an extra admin user with the login values:

```
_id: "rocketchat.internal.admin.test"
name: "RocketChat Internal Admin Test"
username: "rocketchat.internal.admin.test"
emails: "rocketchat.internal.admin.test@rocket.chat"
password: "rocketchat.internal.admin.test"
```

### Run Tests

On another terminal window, run the test with the command below:

`meteor npm run chimp-test`

#### Troubleshooting

1. babel-runtime:

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


2. bcrypt:

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
*Don’t panic* =) It means that the bcrypt library is not installed on your system and meteor will use a javascript alternative that is about three times slower.

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

  # Donate

Rocket.Chat will be free forever, but you can help us speed-up the development!

[![Donate](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=ZL94ZE6LGVUSN)

[![Bitcoins](https://github.com/RocketChat/Rocket.Chat.Docs/blob/master/1.%20Contributing/Donating/coinbase.png?raw=true)](https://www.coinbase.com/checkouts/ac2fa967efca7f6fc1201d46bdccb875)


[BountySource](https://www.bountysource.com/teams/rocketchat)
