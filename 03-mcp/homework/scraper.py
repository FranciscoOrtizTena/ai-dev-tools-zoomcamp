import requests


def fetch_markdown(url: str) -> str:
    """
    Fetch the markdown rendering of a URL via Jina Reader.

    Args:
        url: Original URL to fetch.

    Returns:
        Markdown content returned by Jina Reader.
    """
    cleaned_url = url.strip()
    jina_url = "https://r.jina.ai/" + cleaned_url
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; HomeworkScraper/1.0)"
    }
    response = requests.get(jina_url, timeout=30, headers=headers)
    response.raise_for_status()
    return response.text
