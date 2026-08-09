import { NextRequest, NextResponse } from "next/server";
import { useTranslation } from "react-i18next";
import { ILivechatBusinessHour } from "@rocket.chat/core-typings";

export async function middleware(req: NextRequest) {
  const token = req.headers.get("authorization");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { t } = useTranslation();

  const businessHours: ILivechatBusinessHour[] = [
    {
      day: "Monday",
      from: "09:00",
      to: "17:00",
      hours: [
        {
          from: "09:00",
          to: "12:00",
          text: t("Monday from 9am to 12pm"),
          url: "https://example.com/monday",
        },
        {
          from: "13:00",
          to: "17:00",
          text: t("Monday from 1pm to 5pm"),
          url: "https://example.com/monday",
        },
      ],
    },
    {
      day: "Tuesday",
      from: "09:00",
      to: "17:00",
      hours: [
        {
          from: "09:00",
          to: "12:00",
          text: t("Tuesday from 9am to 12pm"),
          url: "https://example.com/tuesday",
        },
        {
          from: "13:00",
          to: "17:00",
          text: t("Tuesday from 1pm to 5pm"),
          url: "https://example.com/tuesday",
        },
      ],
    },
  ];

  return NextResponse.next();
}