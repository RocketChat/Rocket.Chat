import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

export async function middleware(req: NextRequest) {
  const token = req.headers.get("authorization");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if the workspace is served over a plain HTTP origin
  if (req.url.startsWith('http://')) {
    // Implement a fallback for crypto.randomUUID()
    const roomId = uuidv4();
    // Use the fallback roomId
    const roomHistoryManager = new RoomHistoryManager(roomId);
    // Rest of the code remains the same
  } else {
    // Use crypto.randomUUID() for secure origins
    const roomId = crypto.randomUUID();
    const roomHistoryManager = new RoomHistoryManager(roomId);
  }

  return NextResponse.next();
}