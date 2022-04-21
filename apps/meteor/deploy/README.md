- [Deploying](#deploying)
  - [Files](#files)
  - [Environment variables](#environment-variables)
  - [Basic configuration](#basic-configuration)
  - [Deploying without MongoDB authentication](#deploying-without-mongodb-authentication)
  - [Deploying with MongoDB authentication](#deploying-with-mongodb-authentication)
  - [Deploying with HTTPS](#deploying-with-https)
  - [Deploying with HTTPS (including MongoDB authentication)](#deploying-with-https-including-mongodb-authentication)
  - [Migrating from exiting the compose file](#migrating-from-exiting-the-compose-file)

# Deploying

*These compose files are compatible only with compose v2. You can install compose v2 here:- https://docs.docker.com/compose/cli-command/*
*Compose v1 is no longer supported.*

## Files

There are two files, 
* `compose.yml` this is similar to your old compose file.
* `compose-auth.yml` this template makes enabling mongodb authentication easier.
* `compose-https.yml` this template includes traefik to help with deployments with TLS cert and FQDN.
* `compose-auth-https.yml` same as `compose-auth.yml` with easy HTTPS setup.

## Environment variables 

| RELEASE         | Rocket.Chat Release (version); defaults to the latest (:latest tag)  |
|-----------------|----------------------------------------------------------------------|
| MONGODB_VERSION | MongoDB Version (defaults to 4.4)                                    |
| MONGO_URL       | MongoDB connection string                                            |
| MONGO_OPLOG_URL | MongoDB connection string pointing to local database                 |
| ROOT_URL        | URL pointing to your Rocket.Chat instance                            |
| PORT            | Port Rocket.Chat will bind itself to (you can avoid this)            |
| HOST_PORT       | Port on the host that the container will bind to (defaults to 3000)  |
| BIND_IP         | IP the container will bind to (defaults to  all interfaces; 0.0.0.0) |

For MongoDB's available environment variables, read:- https://hub.docker.com/r/bitnami/mongodb`

## Basic configuration

For basic configuration, you need a `.env` file.

Copy the example one, `cp env.example .env`.

All environment variables have sane defaults for each templates, with exceptions mentioned in the following dedicated sections.

Refer to the table above for the available environment variables.

## Deploying without MongoDB authentication

If you want to deploy Rocket.Chat without any kinds on MongoDB authentication, use the `compose.yml` template.

In this dierctory, just run

```
docker compose up -d
```

## Deploying with MongoDB authentication

Open the `.env` file.

Now, define the variables `MONGODB_PASSWORD` (non-root user password; for rocketchat's database), `MONGODB_ROOT_PASSWORD` (root user password; for oplog tailing), `MONGODB_REPLICA_SET_KEY` (replica set [key](https://docs.mongodb.com/manual/tutorial/enforce-keyfile-access-control-in-existing-replica-set/)).

Optionally, you can also define,
* `MONGODB_DATABASE` this is the database rocket.chat will use; defaults to `rocketchat`.
* `MONGODB_ROOT_USER` username for the all-powerful root user; defaults to `root`.
* `MONGODB_USERNAME` username for the non-root user that rocket.chat will use to authenticate itself against its database; defaults to `rocketchat`.

Next run,

```
docker compose -f compose-auth.yml up -d
```

*`MONGO_URL`, `MONGO_OPLOG_URL` is generated from the above variables in case of `compose-auth.yml`*

## Deploying with HTTPS

Open `.env` file.

For this one, you need two environment variables, 
* `DOMAIN` the FQDN of your server, make sure it resolves to your server's IP.`
* `LETSENCRYPT_EMAIL` an email id for cert expiration notifications, and anything else related.

Finally, run

```
docker compose -f compose-https.yml up -d
```

## Deploying with HTTPS (including MongoDB authentication)

Same as [Deploying with HTTPS](#deploying-with-https), but also add the environment variabled from [Deploying with MongoDB authentication](#deploying-with-mongodb-authentication).

Deploy by running 

```
docker compose -f compose-auth-https.yml up -d
```

## Migrating from exiting the compose file

Our existing `docker-compose.yml` file uses MongoDB 4.0, thus the now-unsupported mmapv1 storage engine. This migration will take care of that at the same time.

**1. Backup data from existing install**

  Move to project directory

  ```
  cd <compose file location>
  ```

  Create backup

  ```
  docker compose exec -T mongo mongodump --archive > db.dump
  ```

**2. Edit compose file to use the new one**  
**3. Add any additional volumes you had in your previous compose file**  
**4. Start only the MongoDB container**  

  ```
  docker compose up -d mongodb
  ```

**5. Restore data**  

  Run, 

  ```
  docker compose exec -T mongodb mongorestore --archive < db.dump
  ```

  > if you're restoring over an existing install, pass `--drop` to `mongorestore`.


**6. Move any existing environment variables to a .env file**

  > Since your database already has all user/authentication data, there is no need to add the `MONGODB_*` environment variables. Just copying the `MONGO_URL` and `MONGO_OPLOG_URL` variables is enough.

**7. Deploy Rocket.Chat**  

  ```
  docker compose up -d
  ```
