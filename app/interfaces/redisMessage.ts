import { Timestamp } from "bson";

export interface redisMessage {
    ts: Timestamp; 
    h: number; 
    op: "i" | "u" | "d" | "c" | "n"; 
    ns: string;
    _id: string;
  
    [key: string]: any;
  }
  