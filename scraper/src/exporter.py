import json
import os
from datetime import datetime, timezone
from typing import List, Optional

from .models import Edition, EditionSummary, Category


def export_edition_json(
    edition: Edition,
    output_dir: str = "data",
    sync_web_dir: Optional[str] = "web/public/data"
) -> str:
    """Export an edition's data to nominees.json in both scraper and frontend directories."""
    # Target directory under scraper/data/<year>/
    year_dir = os.path.join(output_dir, str(edition.year))
    os.makedirs(year_dir, exist_ok=True)
    file_path = os.path.join(year_dir, "nominees.json")

    # Serialize using Pydantic model_dump
    data = edition.model_dump()

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"[Exporter] Saved {edition.year} ({edition.categories_count} categories) to {file_path}")

    # Optionally sync to frontend web public directory
    if sync_web_dir:
        web_year_dir = os.path.join(sync_web_dir, str(edition.year))
        os.makedirs(web_year_dir, exist_ok=True)
        web_file_path = os.path.join(web_year_dir, "nominees.json")
        with open(web_file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"[Exporter] Synced {edition.year} to {web_file_path}")

    return file_path


def export_editions_manifest(
    summaries: List[EditionSummary],
    output_dir: str = "data",
    sync_web_dir: Optional[str] = "web/public/data"
) -> str:
    """Export the list of available editions to editions.json."""
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, "editions.json")

    data = [s.model_dump() for s in sorted(summaries, key=lambda x: x.year, reverse=True)]

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"[Exporter] Saved editions manifest ({len(summaries)} years) to {file_path}")

    if sync_web_dir:
        os.makedirs(sync_web_dir, exist_ok=True)
        web_file_path = os.path.join(sync_web_dir, "editions.json")
        with open(web_file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"[Exporter] Synced editions manifest to {web_file_path}")

    return file_path
