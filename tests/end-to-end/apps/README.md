# Quick Start

1. Make sure you've created a test user with the following configuration on your local development server:

```
username: rocketchat.internal.admin.test
password: rocketchat.internal.admin.test
email: rocketchat.internal.admin.test@rocket.chat
role: admin, owner
```

2. Run the command `meteor npm run testapps` to start automation tests


## Other Notes

1. We use the library `superagent` for API testing. You can `req._data` to print the body of a http request.

Example:

```javascript
const req = request.post(apps())
    .set(credentials)
    .send({
        url: APP_URL,
    })
    .expect((res) => {
        console.log({
            reqBody: req._data,
            resBody: res.body
        });
    });
```
