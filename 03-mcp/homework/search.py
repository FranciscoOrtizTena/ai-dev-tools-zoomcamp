from __future__ import annotations

from pathlib import Path, PurePosixPath
import zipfile
from typing import Iterable, List, Dict

import requests
from minsearch import Index

DATA_URL = "https://github.com/jlowin/fastmcp/archive/refs/heads/main.zip"
ZIP_DEST = Path("fastmcp-main.zip")

_index: Index | None = None


def download_archive(url: str = DATA_URL, dest: Path = ZIP_DEST) -> Path:
    """
    Download the fastmcp repo archive unless it already exists.
    """
    if dest.exists():
        return dest

    response = requests.get(url, stream=True, timeout=120)
    response.raise_for_status()

    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)

    return dest


def _strip_first_path_component(path: str) -> str:
    parts = PurePosixPath(path).parts
    if len(parts) <= 1:
        return PurePosixPath(path).name
    return str(PurePosixPath(*parts[1:]))


def _read_markdown_files(zip_path: Path) -> Iterable[Dict[str, str]]:
    """
    Yield markdown documents from a zip file with normalized filenames.
    """
    with zipfile.ZipFile(zip_path) as archive:
        for member in archive.infolist():
            if member.is_dir():
                continue
            suffix = PurePosixPath(member.filename).suffix.lower()
            if suffix not in {".md", ".mdx"}:
                continue

            normalized_name = _strip_first_path_component(member.filename)
            with archive.open(member) as fp:
                content = fp.read().decode("utf-8", errors="ignore")

            yield {"filename": normalized_name, "content": content}


def load_documents() -> List[Dict[str, str]]:
    """
    Collect markdown documents from every zip file in the current directory.
    """
    download_archive()
    docs: List[Dict[str, str]] = []
    for zip_path in sorted(Path(".").glob("*.zip")):
        docs.extend(list(_read_markdown_files(zip_path)))
    return docs


def build_index(docs: List[Dict[str, str]]) -> Index:
    index = Index(text_fields=["content"], keyword_fields=["filename"])
    index.fit(docs)
    return index


def ensure_index() -> Index:
    global _index
    if _index is None:
        docs = load_documents()
        _index = build_index(docs)
    return _index


def search(query: str, num_results: int = 5) -> List[Dict[str, str]]:
    """
    Search the indexed documents, returning the top matches.
    """
    index = ensure_index()
    return index.search(query, num_results=num_results)


if __name__ == "__main__":
    results = search("demo", num_results=5)
    for doc in results:
        print(doc["filename"])
