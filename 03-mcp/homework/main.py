from fastmcp import FastMCP

from scraper import fetch_markdown
from search import search as search_docs

mcp = FastMCP("Demo 🚀")

@mcp.tool
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

@mcp.tool
def scrape_web(url: str) -> str:
    """Fetch a webpage as markdown via Jina Reader (r.jina.ai)."""
    return fetch_markdown(url)

@mcp.tool
def search_documents(query: str):
    """Search the fastmcp docs indexed with minsearch (top 5)."""
    return search_docs(query, num_results=5)

if __name__ == "__main__":
    mcp.run()
