# Instructions to run the meteor development branch of 3.0 version

1. Clone the meteor project locally following the instructions at https://github.com/meteor/meteor/blob/devel/DEVELOPMENT.md
2. Change to the branch `release-3.0`
3. Add a alias for the cloned meteor project named `md` (example `alias md=/Users/rocket.chat/Projects/meteor/meteor`). Instructions on link above as well.
4. Checkout the Rocket.Chat's branch named `meteor-3.0`
5. Run the project `NODE_OPTIONS="--trace-warnings --unhandled-rejections=warn" DISABLE_FIBERS=1 IGNORE_ASYNC_PLUGIN=1 md`
