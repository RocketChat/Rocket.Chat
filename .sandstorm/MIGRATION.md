# Migrate sandstorm version to standalone

In this document, you can migate your sandstorm version Rocket.Chat to Standalone version.

```
# Requirements:
A sandstorm with your Rocket.Chat
MongoDB 3.2 (You can upgrade to latest later)
Standalone RocketChat Server
```

## 1: Get your grain data (Rocket.Chat data)

```
Example of your Rocket.Chat grain
http://local.sandstorm.io:6080/grain/JHbcuaBi6J2hCJjNQdECHQ/channel/general

Your grain ID: JHbcuaBi6J2hCJjNQdECHQ

Grain location in your server: 
/opt/sandstorm/var/sandstorm/grains/JHbcuaBi6J2hCJjNQdECHQ
```

<img src="migration01.jpg" width='100%'>



## 2:  Moving your grain data to other folder

```
# change to root user first.
$ sudo su
# move to your home or any folder.
$ cp -r /opt/sandstorm/var/sandstorm/grains/JHbcuaBi6J2hCJjNQdECHQ /opt/
```

##  3: Use mongo shell to modify db.

```
# https://www.mongodb.com/download-center/community
Use mongodb 3.2.

# dbpath is your db path.
# start mongodb server
$ ./mongo/bin/mongod --dbpath=/opt/sandbox/wiredTigerDB

# open the new terminal
$ ./mongo/bin/mongo

MongoDB shell version: 3.2.22
connecting to: test
> show dbs
local   0.000GB
meteor  0.003GB

# copy the original to standalone
> db.copyDatabase('meteor','rocketchat')

```

## 4: Start your Rocket.Chat Standalone server

You may see these db migration log.

```
Updating process.env.MAIL_URL
LocalStore: store created at 
LocalStore: store created at 
LocalStore: store created at 
Starting Email Intercepter...
Setting default file store to GridFS
Warning: connect.session() MemoryStore is not
designed for a production environment, as it will leak
memory, and will not scale past a single process.
{"line":"121","file":"migrations.js","message":"Migrations: Migrating from version 88 -> 137","time":{"$date":1553179849093},"level":"info"}
{"line":"121","file":"migrations.js","message":"Migrations: Running up() on version 89","time":{"$date":1553179849095},"level":"info"}
{"line":"121","file":"migrations.js","message":"Migrations: Running up() on version 90","time":{"$date":1553179849099},"level":"info"}
{"line":"121","file":"migrations.js","message":"Migrations: Running up() on version 91","time":{"$date":1553179849151},"level":"info"}
{"line":"121","file":"migrations.js","message":"Migrations: Running up() on version 92","time":{"$date":1553179849156},"level":"info"}
```

## 5: Register and Login

Go to the login page, Register a new admin user.

Setting old user's email or reset password. (By enabling EMAIL service, let user can reset their password)



<img src="migration02.jpg" width='100%'>