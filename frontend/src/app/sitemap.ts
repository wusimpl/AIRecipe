import { MetadataRoute } from "next";

/**
 * 动态生成 sitemap.xml
 * 用于帮助搜索引擎发现和索引网站页面
 *
 * 访问地址: https://wusimpl.fun/sitemap.xml
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8090';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    // 未来可扩展添加更多页面:
    // {
    //   url: `${baseUrl}/recipe/红烧肉`,
    //   lastModified: new Date(),
    //   changeFrequency: 'weekly',
    //   priority: 0.8,
    // },
  ];
}
