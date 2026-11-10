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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L2l1c2VyL3BhY2thZ2VzL2FwcHMtZW5naW5lL3NyYy9kZWZpbml0aW9uL21ldGFkYXRhL1JvY2tldENoYXRBc3NvY2lhdGlvbnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGVudW0gUm9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWwge1xuXHRST09NID0gJ3Jvb20nLFxuXHRESVNDVVNTSU9OID0gJ2Rpc2N1c3Npb24nLFxuXHRNRVNTQUdFID0gJ21lc3NhZ2UnLFxuXHRMSVZFQ0hBVF9NRVNTQUdFID0gJ2xpdmVjaGF0LW1lc3NhZ2UnLFxuXHRVU0VSID0gJ3VzZXInLFxuXHRGSUxFID0gJ2ZpbGUnLFxuXHRNSVNDID0gJ21pc2MnLFxuXHRWSURFT19DT05GRVJFTkNFID0gJ3ZpZGVvLWNvbmZlcmVuY2UnLFxufVxuXG5leHBvcnQgY2xhc3MgUm9ja2V0Q2hhdEFzc29jaWF0aW9uUmVjb3JkIHtcblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSBtb2RlbDogUm9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWwsXG5cdFx0cHJpdmF0ZSBpZDogc3RyaW5nLFxuXHQpIHt9XG5cblx0cHVibGljIGdldE1vZGVsKCkge1xuXHRcdHJldHVybiB0aGlzLm1vZGVsO1xuXHR9XG5cblx0cHVibGljIGdldElEKCkge1xuXHRcdHJldHVybiB0aGlzLmlkO1xuXHR9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtVQUFZOzs7Ozs7Ozs7R0FBQSwrQkFBQTtBQVdaLE9BQU8sTUFBTTs7O0VBQ1osWUFDQyxBQUFRLEtBQWlDLEVBQ3pDLEFBQVEsRUFBVSxDQUNqQjtTQUZPLFFBQUE7U0FDQSxLQUFBO0VBQ047RUFFSSxXQUFXO0lBQ2pCLE9BQU8sSUFBSSxDQUFDLEtBQUs7RUFDbEI7RUFFTyxRQUFRO0lBQ2QsT0FBTyxJQUFJLENBQUMsRUFBRTtFQUNmO0FBQ0QifQ==