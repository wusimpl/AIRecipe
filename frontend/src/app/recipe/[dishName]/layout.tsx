import { Metadata } from 'next';

/**
 * 动态生成 SEO metadata
 */
export async function generateMetadata({
  params,
}: {
  params: { dishName: string };
}): Promise<Metadata> {
  const dishName = decodeURIComponent(params.dishName);

  return {
    title: `${dishName} - AIRecipe 菜谱`,
    description: `查看 ${dishName} 的详细菜谱，包括食材清单、烹饪步骤和注意事项。由 AI 智能生成，专业可靠。`,
    keywords: [dishName, '菜谱', '做法', '烹饪', 'AI 菜谱', '食谱'],

    // Open Graph (社交媒体分享)
    openGraph: {
      title: `${dishName} - AIRecipe 菜谱`,
      description: `查看 ${dishName} 的详细菜谱，包括食材清单、烹饪步骤和注意事项`,
      type: 'article',
      locale: 'zh_CN',
      siteName: 'AIRecipe',
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: `${dishName} - AIRecipe 菜谱`,
      description: `查看 ${dishName} 的详细菜谱`,
    },

    // 其他 meta 标签
    alternates: {
      canonical: `/recipe/${encodeURIComponent(dishName)}`,
    },
  };
}

export default function RecipeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
