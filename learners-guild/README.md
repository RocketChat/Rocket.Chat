# Learners Guild Rocket.Chat

This is Learners Guild's custom fork of Rocket.Chat. The primary difference is the precense of a few custom plugins, a small startup script, and this readme.

## Getting Started

1. Clone the repository.

2. Checkout the `lg-master` branch.

3. Setup and run [mehserve][mehserve]. Then figure out which port you intend to use and create the mehserve config file:

        $ echo 3000 > ~/.mehserve/chat.learnersguild

4. Set your `NODE_ENV` environment variable:

        $ export NODE_ENV=development

5. Create your `.env` file for your environment. Example:

        export APP_BASEURL=http://chat.learnersguild.dev
        export ROOT_URL=http://chat.learnersguild.dev/
        export JWT_PUBLIC_KEY="<IDM PUBLIC KEY (let it
        span
        multiple
        lines)>"

6. Install [Meteor][meteor]

        curl https://install.meteor.com/ | sh

7. Run the server:

        $ learners-guild/start.sh

[mehserve]: https://github.com/timecounts/mehserve
[meteor]: https://www.meteor.com/
