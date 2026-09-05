import argparse
import os
import sys
from datetime import datetime, timezone

# Ensure scraper package is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.crawler import Crawler, CeremonyPageNotFoundError
from src.parser import parse_edition_categories, parse_ceremonies_list
from src.models import Edition, EditionSummary
from src.exporter import export_edition_json, export_editions_manifest


def process_edition(crawler: Crawler, year: int, html_content: str, output_dir: str, sync_web_dir: str) -> EditionSummary:
    """Parse, validate, and export a single edition."""
    print(f"\n[Scraper] Processing year {year}...")
    categories = parse_edition_categories(html_content)
    
    has_winners = any(c.winner_id is not None for c in categories)
    status = "concluded" if has_winners else "open"

    edition = Edition(
        year=year,
        title=f"The Game Awards {year}",
        status=status,
        last_updated=datetime.now(timezone.utc).isoformat(),
        categories_count=len(categories),
        categories=categories
    )

    export_edition_json(edition, output_dir=output_dir, sync_web_dir=sync_web_dir)

    return EditionSummary(
        year=year,
        title=edition.title,
        status=status,
        categories_count=edition.categories_count,
        has_winners=has_winners,
        url=f"https://pt.wikipedia.org/wiki/The_Game_Awards_{year}"
    )


def main():
    parser = argparse.ArgumentParser(
        description="GOTY Picks - The Game Awards Wikipedia Scraper (2014-Present)"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--year",
        type=int,
        help="Scrape a single year (e.g. --year 2025)"
    )
    group.add_argument(
        "--all",
        action="store_true",
        help="Scrape all available years (2014 to present) from the main Wikipedia page"
    )
    group.add_argument(
        "--local",
        type=str,
        help="Parse a local HTML file directly (e.g. for offline testing with files in examples/)"
    )

    parser.add_argument(
        "--local-year",
        type=int,
        default=2025,
        help="Year to associate when using --local (defaults to 2025)"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "data"),
        help="Directory to save JSON files (default: scraper/data)"
    )
    parser.add_argument(
        "--sync-web-dir",
        type=str,
        default=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web", "public", "data")),
        help="Target directory to sync JSON data for the web frontend (default: web/public/data)"
    )
    parser.add_argument(
        "--no-sync-web",
        action="store_true",
        help="Disable automatic syncing to the web frontend directory"
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="Delay in seconds between requests (default: 1.0s)"
    )

    args = parser.parse_args()

    # Determine sync path
    sync_dir = None if args.no_sync_web else args.sync_web_dir

    crawler = Crawler(delay=args.delay)
    summaries = []

    if args.local:
        print(f"[Scraper] Running in local offline mode with file: {args.local}")
        html = crawler.load_local_html(args.local)
        summary = process_edition(
            crawler=crawler,
            year=args.local_year,
            html_content=html,
            output_dir=args.output_dir,
            sync_web_dir=sync_dir
        )
        summaries.append(summary)
        export_editions_manifest(summaries, output_dir=args.output_dir, sync_web_dir=sync_dir)

    elif args.year:
        print(f"[Scraper] Fetching edition for year: {args.year}")
        try:
            html = crawler.fetch_edition_page(args.year)
            summary = process_edition(
                crawler=crawler,
                year=args.year,
                html_content=html,
                output_dir=args.output_dir,
                sync_web_dir=sync_dir
            )
            summaries.append(summary)
            export_editions_manifest(summaries, output_dir=args.output_dir, sync_web_dir=sync_dir)
        except CeremonyPageNotFoundError as e:
            print(f"\n[Scraper] Notice: The Game Awards {args.year} article has not been created yet on Wikipedia.")
            print(f"Details: {e}")
            sys.exit(0)

    elif args.all:
        print("[Scraper] Fetching main page to discover all ceremony years...")
        main_html = crawler.fetch_main_page()
        ceremonies = parse_ceremonies_list(main_html)
        print(f"[Scraper] Found {len(ceremonies)} ceremony editions: {[c['year'] for c in ceremonies]}")

        for ceremony in ceremonies:
            year = ceremony["year"]
            try:
                html = crawler.fetch_edition_page(year)
                summary = process_edition(
                    crawler=crawler,
                    year=year,
                    html_content=html,
                    output_dir=args.output_dir,
                    sync_web_dir=sync_dir
                )
                summaries.append(summary)
            except Exception as e:
                print(f"[Scraper] Error processing year {year}: {e}")

        export_editions_manifest(summaries, output_dir=args.output_dir, sync_web_dir=sync_dir)

    print("\n[Scraper] Done! All requested data successfully scraped and exported.")


if __name__ == "__main__":
    main()
