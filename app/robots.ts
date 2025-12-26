import { MetadataRoute } from "next";

const BASE_URL = "https://sajuro.co.kr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/account/",
          "/vault/",
          "/sign-in",
          "/sign-up",
          "/auth-test",
          "/storage-test",
          "/bazi-test",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
