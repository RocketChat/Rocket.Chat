vcl 4.0;

backend default {
    .host = "rocketchat";
    .port = "3000";
}

sub vcl_recv {

    if(req.url ~ "/websocket$") {
         return (pipe);
    }


    # Don't cache WebSocket connections
   if (req.http.Upgrade ~ "(?i)websocket") {
         return (pipe);
    }


    # Don't cache API requests
    if (req.url ~ "^/api/") {
        return (pass);
    }

    # Cache static assets
    if (req.url ~ "\.(css|js|jpg|jpeg|png|gif|ico|woff|woff2|ttf|eot)$") {
        return (hash);
    }
}

sub vcl_backend_response {
    # Cache successful responses for 1 hour
    if (beresp.status == 200) {
        set beresp.ttl = 1h;
    }
}