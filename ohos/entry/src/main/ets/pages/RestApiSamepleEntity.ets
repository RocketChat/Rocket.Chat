/**
 *  MIT License
 *
 *  Copyright (c) 2023 Huawei Device Co., Ltd.
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 */

export class PageData{
  token?: string = ""
  rid?: string = ""
  pageInfo?:pageInfo = new pageInfo()
}
export class pageInfo{
  change: string = "";
  title: string = "";
  location: location = new location()
}
export class location{
  href:string =  ""
}

export class VisitorInfo{
  visitor:visitor = new visitor()
}
export class visitor{
  name:string = "";
  email:string = "";
  token:string = "";
  phone:string = "";
  customFields: CustomFields[] = []
}
export class CustomFields{
  key: string = "";
  value:string = "";
  overwrite:boolean =  true
}
export class VisitorStatus{
  token:string = "";
  status: string = "";
}

export class Data{
  roomId:string = "";
  userId:string = "";
}
export class OptionalParams{
  latest:string = "";
  oldest: string = "";
  inclusive: boolean = false;
  offset: number = 0;
  count: number = 0;
  unreads: boolean = false;
}
export class CustomField{
  organization: string = ""
}
export class PostMessageData{
  channel: string = "";
  emoji: string = "";
  roomId: string = "";
  text: string = "";
  attachments:Attachments[] =  []
}
export class Attachments{
  audio_url: string = "";
  author_icon: string = "";
  author_link: string = "";
  author_name: string = "";
  collapsed: boolean = false;
  color: Color = Color.White;
  fields: Fields[] = [];
  message_link: string = "";
  text: string = "";
  thumb_url: string = "";
  title: string = "";
  title_link: string = "";
  title_link_download:boolean = true;
  ts: string = "";
  video_url: string = ""
}
export class Fields {
  short: boolean = true;
  title: string = "";
  value: string = "";
}

export class AvatarData{
  avatarUrl: string = "";
  username?: string = "";
  userId?: string = "";
}

export class OnClickUsersListData{
  fields: FieldsOnClickUsersListData = new FieldsOnClickUsersListData();
  query: Query = new Query()
}
export class FieldsOnClickUsersListData{
  name: number = 0;
  emails: number = 0
}
export class Query{
  active: boolean = false;
  type: Type = new Type()
}
export class Type{
  $in:string[] = []
}

export class OnClickUsersCreate{
  name?: string = "";
  email?: string = "";
  password?: string = "";
  username?: string = "";
  active?: boolean = true;
  roles?: string[] = [];
  joinDefaultChannels?:  boolean = true;
  requirePasswordChange?:  boolean = false;
  sendWelcomeEmail?: boolean = false;
  verified?: boolean = false;
  customFields?: undefined;
}