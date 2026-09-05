import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.parser import slugify, clean_text, split_nominee_text, parse_edition_categories
from src.models import Nominee, Category, Edition


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


if __name__ == "__main__":
    unittest.main()
