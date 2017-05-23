PaintChat app for RocketChat

Deployment instructions

### Clone RocketChat
  * git clone https://github.com/RocketChat/Rocket.Chat.git
  * cd Rocket.Chat/packages/
  * git submodule add https://github.com/<package-location>

### Checkout latest released tag to its down branch
 * git tag -l
 * git checkout -b 0.49.4 0.49.4
 * git stash
 * git checkout -b 0.49.4 0.49.4
 * git branch
 * history | less
 * git pull origin master

### Install Rocket Chat npms
 * meteor npm install

### Add the paintchat package
 * meteor add paintchat:paintchat-main --allow-superuser

