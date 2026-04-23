Meteor.startup(() => {
  WebAppLocalServer.onError((error) => {
    console.error(error);
  });
});
