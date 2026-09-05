import os
import time
import requests
from typing import Optional

MAIN_WIKI_URL = "https://pt.wikipedia.org/wiki/The_Game_Awards"
DEFAULT_USER_AGENT = "GOTYPicksBot/1.0 (+https://github.com/vitorsfeijo/goty-picks)"


class CeremonyPageNotFoundError(Exception):
    """Raised when an edition page has not yet been created on Wikipedia (HTTP 404)."""
    pass


class Crawler:
    """Handles HTTP requests to Wikipedia with proper headers, polite retries, and offline fallback."""

    def __init__(self, user_agent: str = DEFAULT_USER_AGENT, timeout: int = 15, delay: float = 1.0):
        self.headers = {"User-Agent": user_agent}
        self.timeout = timeout
        self.delay = delay

    def fetch_url(self, url: str, max_retries: int = 3) -> str:
        """Fetch HTML content from a URL with retries and delay."""
        last_error = None
        for attempt in range(1, max_retries + 1):
            try:
                response = requests.get(url, headers=self.headers, timeout=self.timeout)
                if response.status_code == 404:
                    raise CeremonyPageNotFoundError(f"Page does not exist on Wikipedia (HTTP 404): {url}")
                response.raise_for_status()
                # Polite delay between requests
                if self.delay > 0:
                    time.sleep(self.delay)
                return response.text
            except CeremonyPageNotFoundError:
                # Do not retry 404s
                raise
            except requests.RequestException as exc:
                last_error = exc
                wait_time = attempt * 2
                print(f"[Crawler] Attempt {attempt} failed for {url}: {exc}. Retrying in {wait_time}s...")
                time.sleep(wait_time)
        raise RuntimeError(f"Failed to fetch {url} after {max_retries} attempts. Last error: {last_error}")

    def fetch_main_page(self) -> str:
        """Fetch the main Wikipedia article listing all Game Awards ceremonies."""
        return self.fetch_url(MAIN_WIKI_URL)

    def fetch_edition_page(self, year: int) -> str:
        """Fetch the Wikipedia article for a specific ceremony year."""
        url = f"https://pt.wikipedia.org/wiki/The_Game_Awards_{year}"
        return self.fetch_url(url)

    def load_local_html(self, file_path: str) -> str:
        """Load HTML from a local file (e.g. from examples directory for offline testing)."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Local file not found: {file_path}")
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
