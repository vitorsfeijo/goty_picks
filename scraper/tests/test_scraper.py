import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.parser import slugify, clean_text, split_nominee_text, parse_edition_categories
from src.models import Nominee, Category, Edition, EditionSummary
from src.exporter import export_editions_manifest


class TestScraper(unittest.TestCase):

    def test_slugify(self):
        self.assertEqual(slugify("Jogo do Ano"), "jogo-do-ano")
        self.assertEqual(slugify("Clair Obscur: Expedition 33"), "clair-obscur-expedition-33")
        self.assertEqual(slugify("Melhor Direção de Jogo"), "melhor-direcao-de-jogo")
        self.assertEqual(slugify("Baldur's Gate III"), "baldur-s-gate-iii")

    def test_clean_text(self):
        self.assertEqual(clean_text("Melhor Adaptação[d]"), "Melhor Adaptação")
        self.assertEqual(clean_text("Jogo do Ano [14]"), "Jogo do Ano")
        self.assertEqual(clean_text("Vencedor ‡"), "Vencedor")

    def test_split_nominee_text(self):
        name, details = split_nominee_text("Clair Obscur: Expedition 33 – Sandfall Interactive / Kepler Interactive")
        self.assertEqual(name, "Clair Obscur: Expedition 33")
        self.assertEqual(details, "Sandfall Interactive / Kepler Interactive")

        name, details = split_nominee_text("Shovel Knight - Yacht Club Games")
        self.assertEqual(name, "Shovel Knight")
        self.assertEqual(details, "Yacht Club Games")

        name, details = split_nominee_text("MoistCr1TiKaL")
        self.assertEqual(name, "MoistCr1TiKaL")
        self.assertIsNone(details)

    def test_parse_local_2025_html(self):
        local_path = os.path.join(os.path.dirname(__file__), "..", "examples", "The Game Awards 2025 – Wikipédia, a enciclopédia livre.html")
        if not os.path.exists(local_path):
            self.skipTest("Local 2025 example HTML not present")
        
        with open(local_path, "r", encoding="utf-8", errors="ignore") as f:
            html = f.read()

        categories = parse_edition_categories(html)
        self.assertGreaterEqual(len(categories), 25)

        # Check GOTY category
        goty = next((c for c in categories if c.id == "jogo-do-ano"), None)
        self.assertIsNotNone(goty)
        self.assertEqual(goty.winner_id, "clair-obscur-expedition-33")
        self.assertGreaterEqual(len(goty.nominees), 5)

    def test_export_editions_manifest_merge(self):
        import tempfile
        import json
        with tempfile.TemporaryDirectory() as temp_dir:
            summary_2024 = EditionSummary(
                year=2024,
                title="The Game Awards 2024",
                status="concluded",
                categories_count=32,
                has_winners=True
            )
            summary_2025 = EditionSummary(
                year=2025,
                title="The Game Awards 2025",
                status="concluded",
                categories_count=30,
                has_winners=True
            )

            # First export 2024 only
            export_editions_manifest([summary_2024], output_dir=temp_dir, sync_web_dir=None)
            manifest_path = os.path.join(temp_dir, "editions.json")
            self.assertTrue(os.path.exists(manifest_path))

            with open(manifest_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]["year"], 2024)

            # Then export 2025 only (simulating running scraper for 2025)
            export_editions_manifest([summary_2025], output_dir=temp_dir, sync_web_dir=None)

            # Both 2025 and 2024 must now be present, sorted descending
            with open(manifest_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.assertEqual(len(data), 2)
            self.assertEqual(data[0]["year"], 2025)
            self.assertEqual(data[1]["year"], 2024)


if __name__ == "__main__":
    unittest.main()
