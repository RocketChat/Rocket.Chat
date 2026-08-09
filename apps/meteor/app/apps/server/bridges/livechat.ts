import { NextRequest, NextResponse } from "next/server";
import { Meteor } from 'meteor/meteor';

export async function middleware(req: NextRequest) {
  const token = req.headers.get("authorization");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const livechatBridge = Meteor.LivechatBridge;
    if (livechatBridge.isOfflineLicense()) {
      console.error('Offline license detected');
      return NextResponse.json({ error: "Livechat is disabled due to offline license" }, { status: 403 });
    }
  } catch (error) {
    console.error('Error checking livechat license:', error);
  }

  return NextResponse.next();
}