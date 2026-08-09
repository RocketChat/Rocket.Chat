import { NextRequest, NextResponse } from "next/server";
import { useTranslation } from "react-i18next";

export async function middleware(req: NextRequest) {
  const token = req.headers.get("authorization");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.next();
}

export default function NotFoundState() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("not_found.title")}</h1>
      <p>{t("not_found.description")}</p>
      <ul>
        {[
          { text: "https://example.com", link: "https://example.com" },
          { text: "https://example.com_with_underscore", link: "https://example.com_with_underscore" },
        ].map((item, index) => (
          <li key={index}>
            <a href={item.link}>{item.text}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}