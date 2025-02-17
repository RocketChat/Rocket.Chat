export var RocketChatAssociationModel;
(function(RocketChatAssociationModel) {
  RocketChatAssociationModel["ROOM"] = "room";
  RocketChatAssociationModel["DISCUSSION"] = "discussion";
  RocketChatAssociationModel["MESSAGE"] = "message";
  RocketChatAssociationModel["LIVECHAT_MESSAGE"] = "livechat-message";
  RocketChatAssociationModel["USER"] = "user";
  RocketChatAssociationModel["FILE"] = "file";
  RocketChatAssociationModel["MISC"] = "misc";
  RocketChatAssociationModel["VIDEO_CONFERENCE"] = "video-conference";
})(RocketChatAssociationModel || (RocketChatAssociationModel = {}));
export class RocketChatAssociationRecord {
  model;
  id;
  constructor(model, id){
    this.model = model;
    this.id = id;
  }
  getModel() {
    return this.model;
  }
  getID() {
    return this.id;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvYWJoaW5hdi9yb2NrZXQuY2hhdC9Sb2NrZXQuQ2hhdC9wYWNrYWdlcy9hcHBzLWVuZ2luZS9zcmMvZGVmaW5pdGlvbi9tZXRhZGF0YS9Sb2NrZXRDaGF0QXNzb2NpYXRpb25zLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIFJvY2tldENoYXRBc3NvY2lhdGlvbk1vZGVsIHtcbiAgICBST09NID0gJ3Jvb20nLFxuICAgIERJU0NVU1NJT04gPSAnZGlzY3Vzc2lvbicsXG4gICAgTUVTU0FHRSA9ICdtZXNzYWdlJyxcbiAgICBMSVZFQ0hBVF9NRVNTQUdFID0gJ2xpdmVjaGF0LW1lc3NhZ2UnLFxuICAgIFVTRVIgPSAndXNlcicsXG4gICAgRklMRSA9ICdmaWxlJyxcbiAgICBNSVNDID0gJ21pc2MnLFxuICAgIFZJREVPX0NPTkZFUkVOQ0UgPSAndmlkZW8tY29uZmVyZW5jZScsXG59XG5cbmV4cG9ydCBjbGFzcyBSb2NrZXRDaGF0QXNzb2NpYXRpb25SZWNvcmQge1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIG1vZGVsOiBSb2NrZXRDaGF0QXNzb2NpYXRpb25Nb2RlbCxcbiAgICAgICAgcHJpdmF0ZSBpZDogc3RyaW5nLFxuICAgICkge31cblxuICAgIHB1YmxpYyBnZXRNb2RlbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWw7XG4gICAgfVxuXG4gICAgcHVibGljIGdldElEKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pZDtcbiAgICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtVQUFZOzs7Ozs7Ozs7R0FBQSwrQkFBQTtBQVdaLE9BQU8sTUFBTTs7O0VBQ1QsWUFDSSxBQUFRLEtBQWlDLEVBQ3pDLEFBQVEsRUFBVSxDQUNwQjtTQUZVLFFBQUE7U0FDQSxLQUFBO0VBQ1Q7RUFFSSxXQUFXO0lBQ2QsT0FBTyxJQUFJLENBQUMsS0FBSztFQUNyQjtFQUVPLFFBQVE7SUFDWCxPQUFPLElBQUksQ0FBQyxFQUFFO0VBQ2xCO0FBQ0oifQ==