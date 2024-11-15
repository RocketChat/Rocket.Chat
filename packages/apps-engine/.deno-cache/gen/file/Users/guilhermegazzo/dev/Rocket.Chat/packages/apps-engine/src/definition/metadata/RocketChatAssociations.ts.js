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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL3NyYy9kZWZpbml0aW9uL21ldGFkYXRhL1JvY2tldENoYXRBc3NvY2lhdGlvbnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGVudW0gUm9ja2V0Q2hhdEFzc29jaWF0aW9uTW9kZWwge1xuICAgIFJPT00gPSAncm9vbScsXG4gICAgRElTQ1VTU0lPTiA9ICdkaXNjdXNzaW9uJyxcbiAgICBNRVNTQUdFID0gJ21lc3NhZ2UnLFxuICAgIExJVkVDSEFUX01FU1NBR0UgPSAnbGl2ZWNoYXQtbWVzc2FnZScsXG4gICAgVVNFUiA9ICd1c2VyJyxcbiAgICBGSUxFID0gJ2ZpbGUnLFxuICAgIE1JU0MgPSAnbWlzYycsXG4gICAgVklERU9fQ09ORkVSRU5DRSA9ICd2aWRlby1jb25mZXJlbmNlJyxcbn1cblxuZXhwb3J0IGNsYXNzIFJvY2tldENoYXRBc3NvY2lhdGlvblJlY29yZCB7XG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgbW9kZWw6IFJvY2tldENoYXRBc3NvY2lhdGlvbk1vZGVsLFxuICAgICAgICBwcml2YXRlIGlkOiBzdHJpbmcsXG4gICAgKSB7fVxuXG4gICAgcHVibGljIGdldE1vZGVsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0SUQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlkO1xuICAgIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO1VBQVk7Ozs7Ozs7OztHQUFBLCtCQUFBO0FBV1osT0FBTyxNQUFNOzs7RUFDVCxZQUNJLEFBQVEsS0FBaUMsRUFDekMsQUFBUSxFQUFVLENBQ3BCO1NBRlUsUUFBQTtTQUNBLEtBQUE7RUFDVDtFQUVJLFdBQVc7SUFDZCxPQUFPLElBQUksQ0FBQyxLQUFLO0VBQ3JCO0VBRU8sUUFBUTtJQUNYLE9BQU8sSUFBSSxDQUFDLEVBQUU7RUFDbEI7QUFDSiJ9