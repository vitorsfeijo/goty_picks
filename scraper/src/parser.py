import re
import unicodedata
from typing import List, Tuple, Optional, Dict
from bs4 import BeautifulSoup, Tag

from .models import Nominee, Category, EditionSummary


def slugify(text: str) -> str:
    """Convert string to a clean URL-friendly slug."""
    # Normalize unicode to decompose accents (e.g. é -> e)
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("utf-8")
    # Replace non-alphanumeric characters with hyphens
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_text.lower()).strip("-")
    return slug or "unknown"


def clean_text(text: str) -> str:
    """Remove footnotes like [1], [a], citation references, and normalize whitespace."""
    cleaned = re.sub(r"\[.*?\]", "", text)
    cleaned = cleaned.replace("\u2021", "")  # Remove double dagger ‡
    cleaned = cleaned.replace("\u2020", "")  # Remove dagger †
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def split_nominee_text(raw_text: str) -> Tuple[str, Optional[str]]:
    """
    Split raw nominee text into (name, details).
    Handles en-dash (–), em-dash (—), and standard hyphens (-).
    """
    cleaned = clean_text(raw_text)
    # Split on dash separators (en-dash \u2013, em-dash \u2014, or standard hyphen surrounded by spaces)
    match = re.split(r"\s*[\u2013\u2014]\s*|\s+-\s+", cleaned, maxsplit=1)
    if len(match) == 2:
        name, details = match[0].strip(), match[1].strip()
        return name, details if details else None
    return cleaned, None


def parse_category_td(td: Tag) -> List[Nominee]:
    """
    Extract nominees and winner flag from a category table cell.
    Handles MediaWiki nested lists (where winner <li> wraps a child <ul> with other nominees).
    """
    nominees: List[Nominee] = []
    seen_ids = set()

    uls = td.find_all("ul", recursive=False)
    for ul in uls:
        for li in ul.find_all("li", recursive=False):
            # Check if this <li> wraps a nested <ul> (standard MediaWiki markup for winner + nominees)
            nested_ul = li.find("ul")
            if nested_ul:
                nested_ul_extracted = nested_ul.extract()
                winner_raw = li.get_text()
                is_winner = "\u2021" in winner_raw or "\u2020" in winner_raw or bool(li.find("b"))
                name, details = split_nominee_text(winner_raw)
                
                nominee_id = slugify(name)
                if nominee_id not in seen_ids:
                    seen_ids.add(nominee_id)
                    nominees.append(Nominee(
                        id=nominee_id,
                        name=name,
                        details=details,
                        winner=is_winner
                    ))

                # Parse sub-nominees in the extracted <ul>
                for sub_li in nested_ul_extracted.find_all("li"):
                    sub_raw = sub_li.get_text()
                    sub_winner = "\u2021" in sub_raw or "\u2020" in sub_raw
                    s_name, s_details = split_nominee_text(sub_raw)
                    sub_id = slugify(s_name)
                    if sub_id not in seen_ids:
                        seen_ids.add(sub_id)
                        nominees.append(Nominee(
                            id=sub_id,
                            name=s_name,
                            details=s_details,
                            winner=sub_winner
                        ))
            else:
                raw = li.get_text()
                is_winner = "\u2021" in raw or "\u2020" in raw or bool(li.find("b"))
                name, details = split_nominee_text(raw)
                n_id = slugify(name)
                if n_id not in seen_ids:
                    seen_ids.add(n_id)
                    nominees.append(Nominee(
                        id=n_id,
                        name=name,
                        details=details,
                        winner=is_winner
                    ))

    return nominees


def parse_edition_categories(html: str) -> List[Category]:
    """Parse all award categories and their nominees from ceremony HTML."""
    soup = BeautifulSoup(html, "html.parser")
    categories: List[Category] = []
    seen_cat_ids = set()

    for table in soup.find_all("table", class_="wikitable"):
        # Check if table headers look like category titles
        headers_text = " ".join([th.get_text() for th in table.find_all("th")])
        
        # Skip tally, presenter, and musical performance tables
        if "Indicacoes" in slugify(headers_text) and "jogo" in slugify(headers_text):
            continue
        if any(skip_kw in headers_text.lower() for skip_kw in ["apresentador", "cancao", "musica", "estatistica"]):
            continue
        
        # Check for category indicators
        if not any(kw in headers_text.lower() for kw in ["jogo", "melhor", "inovacao", "voz", "criador"]):
            continue

        rows = table.find_all("tr")
        for i in range(0, len(rows), 2):
            if i >= len(rows):
                break
            header_row = rows[i]
            content_row = rows[i + 1] if i + 1 < len(rows) else None
            if not content_row:
                continue

            ths = header_row.find_all(["th", "td"])
            tds = content_row.find_all("td")
            if not ths or not tds or len(ths) != len(tds):
                continue

            for th, td in zip(ths, tds):
                cat_title = clean_text(th.get_text())
                cat_slug = slugify(cat_title)
                
                # Filter out irrelevant column headers
                if not cat_slug or cat_slug in ["indicacoes", "jogo", "cerimonia", "vencedor"]:
                    continue

                nominees = parse_category_td(td)
                if nominees and cat_slug not in seen_cat_ids:
                    seen_cat_ids.add(cat_slug)
                    winner = next((n for n in nominees if n.winner), None)
                    categories.append(Category(
                        id=cat_slug,
                        title=cat_title,
                        nominees=nominees,
                        winner_id=winner.id if winner else None
                    ))

    return categories


def parse_ceremonies_list(html: str) -> List[Dict[str, str]]:
    """Parse the list of ceremonies and their years from the main Wikipedia article."""
    soup = BeautifulSoup(html, "html.parser")
    ceremonies = []
    seen_years = set()

    # Find links to The_Game_Awards_YYYY
    for a in soup.find_all("a", href=True):
        match = re.search(r"The_Game_Awards_(\d{4})", a["href"])
        if match:
            year = int(match.group(1))
            if year not in seen_years:
                seen_years.add(year)
                ceremonies.append({
                    "year": year,
                    "title": f"The Game Awards {year}",
                    "url": f"https://pt.wikipedia.org/wiki/The_Game_Awards_{year}"
                })

    ceremonies.sort(key=lambda x: x["year"])
    return ceremonies
