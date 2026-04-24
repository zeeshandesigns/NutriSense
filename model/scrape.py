"""
Scrapes Google Images and Bing for Pakistani gap-fill food classes.
Run locally before uploading to Kaggle.

Usage:
    pip install icrawler
    python scrape.py --output_dir ./scraped --target 400
    python scrape.py --output_dir ./scraped --target 400 --classes halwa_puri paya
"""

import argparse
import os

from icrawler.builtin import BingImageCrawler, GoogleImageCrawler

GAP_FILL_CLASSES = [
    ("halwa_puri",    ["halwa puri Pakistani breakfast", "حلوہ پوری"]),
    ("paya",          ["paya Pakistani trotters curry", "پائے"]),
    ("gol_gappa",     ["gol gappa pani puri Pakistani", "گول گپے"]),
    ("nihari_lahori", ["nihari lahori Pakistani", "لاہوری نہاری"]),
    ("channay",       ["channay chana Pakistani street food"]),
    ("dahi_bhalla",   ["dahi bhalla Pakistani chaat"]),
    ("shami_kebab",   ["shami kebab Pakistani fried patty"]),
    ("bun_kebab",     ["bun kebab Pakistani street burger"]),
    ("anda_paratha",  ["anda paratha Pakistani egg paratha breakfast"]),
    ("aloo_paratha",  ["aloo paratha Pakistani stuffed flatbread"]),
    ("karahi",        ["Pakistani karahi chicken wok dish"]),
    ("sajji",         ["sajji Balochi whole roasted lamb"]),
    ("chapli_kebab",  ["chapli kebab Peshawari Pakistani"]),
    ("doodh_patti",   ["doodh patti Pakistani chai tea"]),
    ("jalebi",        ["jalebi Pakistani fried sweet"]),
    ("gulab_jamun",   ["gulab jamun Pakistani dessert syrup"]),
    ("rabri",         ["rabri Pakistani sweet dessert"]),
    ("kheer",         ["kheer Pakistani rice pudding"]),
    ("suji_halwa",    ["suji halwa Pakistani semolina dessert"]),
    ("haleem",        ["haleem Pakistani wheat meat stew"]),
]


def scrape_class(label: str, queries: list[str], output_dir: str, target: int):
    class_dir = os.path.join(output_dir, label)
    os.makedirs(class_dir, exist_ok=True)

    per_query = (target // len(queries)) + 1

    for query in queries:
        existing = len([
            f for f in os.listdir(class_dir)
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
        ])
        if existing >= target:
            break

        n = min(per_query, target - existing)

        try:
            GoogleImageCrawler(storage={"root_dir": class_dir}).crawl(
                keyword=query, max_num=n
            )
        except Exception as e:
            print(f"  Google failed for '{query}': {e}")

        try:
            BingImageCrawler(storage={"root_dir": class_dir}).crawl(
                keyword=query, max_num=n // 2
            )
        except Exception as e:
            print(f"  Bing failed for '{query}': {e}")

    final = len([
        f for f in os.listdir(class_dir)
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
    ])
    print(f"  {label}: {final} images")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output_dir", default="./scraped")
    parser.add_argument("--target", type=int, default=400)
    parser.add_argument("--classes", nargs="*", default=None,
                        help="Subset of class names to scrape (default: all)")
    args = parser.parse_args()

    classes = GAP_FILL_CLASSES
    if args.classes:
        classes = [c for c in GAP_FILL_CLASSES if c[0] in args.classes]

    print(f"Scraping {len(classes)} classes → target {args.target} images each")
    print("After scraping: manually delete watermarked/wrong/blurry images.\n")

    for label, queries in classes:
        print(f"→ {label}")
        scrape_class(label, queries, args.output_dir, args.target)

    print("\nDone. Review ./scraped/ before adding to training data.")


if __name__ == "__main__":
    main()
