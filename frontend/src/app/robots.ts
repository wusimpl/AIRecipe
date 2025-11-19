import { MetadataRoute } from "next";

/**
 * 动态生成 robots.txt
 * 用于控制搜索引擎爬虫的爬取行为
 *
 * 访问地址: https://wusimpl.fun/robots.txt
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8090';

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/_next/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
