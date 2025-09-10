---
'@rocket.chat/meteor': major
---

Removes the setting `API_Use_REST_For_DDP_Calls`. Turning this on meant websocket was only used for realtime data/events, and any other meteor method calls goes over method.call endpoint. For microservice deployments, this had to be turned on. Now method calls will always happen over http endpoints.
