"""CLI entrypoint for the AIRecipe backend service."""

from __future__ import annotations

import os
from pathlib import Path
import sys


def _ensure_project_root_on_path() -> None:
    """Allow running the script from arbitrary working directories."""
    project_root = Path(__file__).resolve().parent
    project_root_str = str(project_root)
    if project_root_str not in sys.path:
        sys.path.insert(0, project_root_str)


def main() -> None:
    _ensure_project_root_on_path()

    import uvicorn

    host = os.getenv("AIRECIPE_HOST", "0.0.0.0")
    port = int(os.getenv("AIRECIPE_PORT", "8000"))
    reload = os.getenv("AIRECIPE_RELOAD", "true").lower() == "true"

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
    )


if __name__ == "__main__":
    main()
