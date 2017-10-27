# Purpose
This package provides the feature of topics and requests. Based on topics (fka. "expertises", which is still present in some of the technical artifacts), a user can issue requests.

## Topics
Topics are defined by a group of users taking care of a particular area of knowledge.
Topics themselves have got no defined end. Each topic is a channel which can be used by the experts who joined this channel in order to exchange information which is not directly related to a request.

## Requests
Requests are created for a particular topic. In contrast to topics, they are rooms with an end: They start with a question and are to be closed once the question is solved.

# AI integration
During the request resolution, Assistify's AI helps by provisioning requests asked earlier and by searching implicitly in external knowledge sources.

# Threading
By providing this hierarchy of channels, requests and topics are some kind of forum or newsgroup - based on instant messaging.
Thus, any type of heavyweight-threading implemented in Rocket.Chat has got the potential to replace much of this implementation.
