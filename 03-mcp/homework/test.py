from scraper import fetch_markdown


def main() -> None:
    content = fetch_markdown("https://github.com/alexeygrigorev/minsearch")
    print(f"Characters: {len(content)}")
    print()
    print("Preview:")
    print(content[:300])


if __name__ == "__main__":
    main()
