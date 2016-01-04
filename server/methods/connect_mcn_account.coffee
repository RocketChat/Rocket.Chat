Future = Npm.require( 'fibers/future' )
Meteor.methods
  checkaccount: (userName, password) ->
    future = new Future()
    Meteor.http.call("POST", "http://140.112.124.238/api/acc_query",
      {data: {username: userName, password: password}},
      (error, result) ->
        if result.statusCode == 200
          future.return(result.statusCode)
        else
          future.return(result.statusCode)
    )

    return future.wait()
