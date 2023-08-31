# E2E Testing with playwright

## Running tests

```sh
$ RC_SERVER_1=http://localhost:3000 RC_SERVER_1_ADMIN_USER=test RC_SERVER_1_ADMIN_PASSWORD=test RC_SERVER_1_MATRIX_SERVER_NAME=my.matrix.server \
RC_SERVER_2=http://localhost:3000 RC_SERVER_2_ADMIN_USER=test2 RC_SERVER_2_ADMIN_PASSWORD=test RC_SERVER_2_MATRIX_SERVER_NAME=my2.matrix.server \
yarn run test:e2e:federation
```

## Important
Make sure to increase the rate limiter for the user register api under Admin => Rate Limiter => Feature limiting. This is necessary since we are registering new users programatically.