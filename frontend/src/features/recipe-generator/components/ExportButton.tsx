"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { ExportModal } from "./ExportModal";
import type { Recipe } from "../types";

interface ExportButtonProps {
  recipe: Recipe;
  provider?: string;
}

export const ExportButton = ({ recipe, provider }: ExportButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
      >
        <Download className="w-4 h-4" />
        <span>导出图片</span>
      </button>

      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipe={recipe}
        provider={provider}
      />
    </>
  );
};
