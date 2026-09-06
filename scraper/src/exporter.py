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
    """Export the list of available editions to editions.json, merging with existing entries."""
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, "editions.json")

    merged: dict[int, EditionSummary] = {}

    # 1. Load existing manifest if present
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
                if isinstance(existing_data, list):
                    for item in existing_data:
                        try:
                            summary = EditionSummary(**item)
                            merged[summary.year] = summary
                        except Exception:
                            pass
        except Exception as e:
            print(f"[Exporter] Warning: could not parse existing manifest: {e}")

    # 2. Discover any year directories with nominees.json on disk
    if os.path.exists(output_dir):
        for entry in os.listdir(output_dir):
            year_path = os.path.join(output_dir, entry)
            if os.path.isdir(year_path) and entry.isdigit():
                nominees_path = os.path.join(year_path, "nominees.json")
                year_num = int(entry)
                if year_num not in merged and os.path.exists(nominees_path):
                    try:
                        with open(nominees_path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            has_winners = any(c.get("winner_id") is not None for c in data.get("categories", []))
                            merged[year_num] = EditionSummary(
                                year=year_num,
                                title=data.get("title", f"The Game Awards {year_num}"),
                                status=data.get("status", "concluded" if has_winners else "open"),
                                categories_count=data.get("categories_count", len(data.get("categories", []))),
                                has_winners=has_winners,
                                url=f"https://pt.wikipedia.org/wiki/The_Game_Awards_{year_num}"
                            )
                    except Exception as e:
                        print(f"[Exporter] Warning: could not parse {nominees_path}: {e}")

    # 3. Merge new summaries (overriding existing for those specific years)
    for s in summaries:
        merged[s.year] = s

    # Sort descending by year
    sorted_summaries = sorted(merged.values(), key=lambda x: x.year, reverse=True)
    data = [s.model_dump() for s in sorted_summaries]

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"[Exporter] Saved editions manifest ({len(data)} years: {[s['year'] for s in data]}) to {file_path}")

    if sync_web_dir:
        os.makedirs(sync_web_dir, exist_ok=True)
        web_file_path = os.path.join(sync_web_dir, "editions.json")
        with open(web_file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"[Exporter] Synced editions manifest to {web_file_path}")

    return file_path
