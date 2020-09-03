## Install Giphy App to Rocket.Chat
### Install Rocket.Chat Apps CLI:

`npm install -g @rocket.chat/apps-cli`

### Build Rocket.Chat.App-Giphy application package (`giphy_0.0.5.zip`):
```
git clone https://github.com/wreiske/Rocket.Chat.App-Giphy
cd Rocket.Chat.App-Giphy
npm install
rc-apps package
```

### Add Giphy App From ZIP:

* Log-in as an admin user into the Rocket.Chat
* Administration/Settings/General/Apps/Enable development mode > `on`
* Administration/Apps/Upload App/Browse Files > `giphy_0.0.5.zip`
* Administration/Settings/General/Apps/Enable development mode > `off`
