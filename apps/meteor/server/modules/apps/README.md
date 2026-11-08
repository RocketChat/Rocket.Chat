# Rocket.Chat Apps
Finally! :smile:

## What is an "Orchestrator"?
An orchestrator is the file/class which is responsible for orchestrating (starting up) everything which is required of the system to get up and going. There are two of these. One for the server and one for the client.

## What is a "Bridge"?
A bridge is a file/class which is responsible for bridging the Rocket.Chat system's data and the App system's data. They are implementations of the interfaces inside of the Rocket.Chat Apps-engine project `src/server/bridges`. They allow the two systems to talk to each other (hence the name bridge, as they "bridge the gap").

## What is a "Converter"?
A converter does what the name implies, it handles converting from one system's data type into the other's. **Note**: This causes a schema to be forced on the rooms and messages.
