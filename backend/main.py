"""
Internal Linking Tool - FastAPI Backend
Connects to OnCrawl API for technical SEO data
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv

from oncrawl_client import OnCrawlClient

load_dotenv()

app = FastAPI(
    title="Internal Linking Tool API",
    description="Backend API for the Internal Linking Tool dashboard",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OnCrawl client
oncrawl_client = OnCrawlClient()

# ============== Project Configuration ==============
# Easy to switch between projects - just update these values

PROJECT_CONFIG = {
    # Current active project
    "active_project": "square_global",  # Switched from seller_community
    
    # Project definitions
    "projects": {
        "seller_community": {
            "name": "Seller Community",
            "crawl_id": "699a1244ff7a69a72490927e",
            "description": "Community forums (temporary for testing)"
        },
        "square_global": {
            "name": "Square Global", 
            "crawl_id": "699eba1335800fd188b68bcc",
            "description": "Main Square website - USE THIS WHEN CRAWL COMPLETES"
        },
        "square_us_en": {
            "name": "Square US-EN",
            "crawl_id": "67ae414d8104eed6fb0e4d92",
            "description": "US English site (archived)"
        }
    },
    
    # Domains to EXCLUDE from analysis
    "excluded_domains": [
        "community.squareup.com",
        # Add more as needed
    ]
}

def get_active_crawl_id() -> str:
    """Get the crawl ID for the currently active project."""
    active = PROJECT_CONFIG["active_project"]
    return PROJECT_CONFIG["projects"][active]["crawl_id"]

def is_excluded_url(url: str) -> bool:
    """Check if URL should be excluded from analysis."""
    for domain in PROJECT_CONFIG["excluded_domains"]:
        if domain in url.lower():
            return True
    return False


# ============== Models ==============

class ApiConfigRequest(BaseModel):
    oncrawl_token: Optional[str] = None


class ThresholdSettings(BaseModel):
    low_inlinks_threshold: int = 3
    deep_page_threshold: int = 4
    min_word_count: int = 300


# ============== Health Check ==============

@app.get("/")
async def root():
    return {"status": "ok", "message": "Internal Linking Tool API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# ============== Project Configuration Endpoints ==============

@app.get("/api/config")
async def get_config():
    """Get current project configuration."""
    active = PROJECT_CONFIG["active_project"]
    active_project = PROJECT_CONFIG["projects"].get(active, {})
    
    return {
        "active_project": active,
        "active_crawl_id": active_project.get("crawl_id"),
        "active_project_name": active_project.get("name"),
        "available_projects": {
            key: {
                "name": val["name"],
                "crawl_id": val["crawl_id"],
                "description": val["description"]
            }
            for key, val in PROJECT_CONFIG["projects"].items()
        },
        "excluded_domains": PROJECT_CONFIG["excluded_domains"]
    }


@app.post("/api/config/switch-project/{project_key}")
async def switch_project(project_key: str):
    """
    Switch the active project.
    
    Available project keys: seller_community, square_global, square_us_en
    """
    if project_key not in PROJECT_CONFIG["projects"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid project key. Available: {list(PROJECT_CONFIG['projects'].keys())}"
        )
    
    PROJECT_CONFIG["active_project"] = project_key
    new_project = PROJECT_CONFIG["projects"][project_key]
    
    # Test if the crawl is accessible
    crawl = oncrawl_client.get_crawl_details(new_project["crawl_id"])
    status = "unknown"
    accessible = False
    
    if crawl:
        status = crawl.get("status", "unknown")
        link_status = crawl.get("link_status", "unknown")
        accessible = link_status == "live" and status in ["done", "running"]
    
    return {
        "success": True,
        "active_project": project_key,
        "project_name": new_project["name"],
        "crawl_id": new_project["crawl_id"],
        "crawl_status": status,
        "data_accessible": accessible,
        "message": f"Switched to {new_project['name']}" + (
            "" if accessible else " (Note: Data may not be accessible yet)"
        )
    }


@app.get("/api/config/check-crawl-status")
async def check_crawl_status():
    """Check the status of all configured crawls."""
    results = []
    
    for key, project in PROJECT_CONFIG["projects"].items():
        crawl_id = project["crawl_id"]
        crawl = oncrawl_client.get_crawl_details(crawl_id)
        
        status_info = {
            "project_key": key,
            "project_name": project["name"],
            "crawl_id": crawl_id,
            "status": "unknown",
            "link_status": "unknown",
            "data_accessible": False,
            "fetched_urls": 0
        }
        
        if crawl:
            status_info["status"] = crawl.get("status", "unknown")
            status_info["link_status"] = crawl.get("link_status", "unknown")
            status_info["fetched_urls"] = crawl.get("fetched_urls", 0)
            status_info["data_accessible"] = (
                status_info["link_status"] == "live" and 
                status_info["status"] in ["done"]
            )
        
        results.append(status_info)
    
    return {
        "active_project": PROJECT_CONFIG["active_project"],
        "crawls": results
    }


# ============== OnCrawl Endpoints ==============

@app.get("/api/oncrawl/test")
async def test_oncrawl_connection():
    """Test OnCrawl API connection."""
    result = oncrawl_client.test_connection()
    return result


@app.get("/api/oncrawl/projects")
async def get_projects():
    """Get all OnCrawl projects."""
    projects = oncrawl_client.get_projects()
    return {"projects": projects, "count": len(projects)}


@app.get("/api/oncrawl/crawls/live")
async def get_live_crawls():
    """Get all live crawls that can be queried."""
    crawls = oncrawl_client.get_live_crawls()
    return {"crawls": crawls, "count": len(crawls)}


@app.get("/api/oncrawl/crawl/{crawl_id}")
async def get_crawl_details(crawl_id: str):
    """Get details for a specific crawl."""
    crawl = oncrawl_client.get_crawl_details(crawl_id)
    if not crawl:
        raise HTTPException(status_code=404, detail="Crawl not found")
    return {"crawl": crawl}


@app.get("/api/oncrawl/crawl/{crawl_id}/summary")
async def get_technical_summary(crawl_id: str):
    """Get technical SEO summary for a crawl."""
    summary = oncrawl_client.get_technical_summary(crawl_id)
    return summary


@app.get("/api/oncrawl/crawl/{crawl_id}/pages")
async def get_pages(
    crawl_id: str,
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0),
    sort_field: str = Query(default="nb_inlinks"),
    sort_order: str = Query(default="asc")
):
    """Get pages from a crawl with pagination."""
    result = oncrawl_client.query_pages(
        crawl_id=crawl_id,
        fields=['url', 'nb_inlinks', 'depth', 'status_code', 'title', 'word_count'],
        sort=[{'field': sort_field, 'order': sort_order}],
        limit=limit,
        offset=offset,
        oql={
            'and': [
                {'field': ['fetched', 'equals', True]},
                {'field': ['status_code', 'equals', 200]}
            ]
        }
    )
    
    if result.get('error'):
        raise HTTPException(status_code=result.get('status_code', 500), detail=result.get('message'))
    
    return result


@app.get("/api/oncrawl/crawl/{crawl_id}/orphaned")
async def get_orphaned_pages(
    crawl_id: str,
    limit: int = Query(default=100, le=1000)
):
    """Get orphaned pages (0 inlinks)."""
    result = oncrawl_client.get_orphaned_pages(crawl_id, limit=limit)
    
    if result.get('error'):
        raise HTTPException(status_code=result.get('status_code', 500), detail=result.get('message'))
    
    return result


@app.get("/api/oncrawl/crawl/{crawl_id}/low-inlinks")
async def get_low_inlinks_pages(
    crawl_id: str,
    max_inlinks: int = Query(default=3),
    limit: int = Query(default=100, le=1000)
):
    """Get pages with low internal links."""
    result = oncrawl_client.get_pages_with_low_inlinks(
        crawl_id=crawl_id,
        max_inlinks=max_inlinks,
        limit=limit
    )
    
    if result.get('error'):
        raise HTTPException(status_code=result.get('status_code', 500), detail=result.get('message'))
    
    return result


@app.get("/api/oncrawl/crawl/{crawl_id}/deep-pages")
async def get_deep_pages(
    crawl_id: str,
    min_depth: int = Query(default=4),
    limit: int = Query(default=100, le=1000)
):
    """Get pages with high crawl depth."""
    result = oncrawl_client.get_deep_pages(
        crawl_id=crawl_id,
        min_depth=min_depth,
        limit=limit
    )
    
    if result.get('error'):
        raise HTTPException(status_code=result.get('status_code', 500), detail=result.get('message'))
    
    return result


@app.get("/api/oncrawl/crawl/{crawl_id}/inlinks-distribution")
async def get_inlinks_distribution(crawl_id: str):
    """Get distribution of pages by inlink count."""
    result = oncrawl_client.get_inlinks_distribution(crawl_id)
    
    if result.get('error'):
        raise HTTPException(status_code=result.get('status_code', 500), detail=result.get('message'))
    
    return result


@app.get("/api/oncrawl/crawl/{crawl_id}/depth-distribution")
async def get_depth_distribution(crawl_id: str):
    """Get distribution of pages by crawl depth."""
    result = oncrawl_client.get_depth_distribution(crawl_id)
    
    if result.get('error'):
        raise HTTPException(status_code=result.get('status_code', 500), detail=result.get('message'))
    
    return result


# ============== Dashboard Data Endpoints ==============

@app.get("/api/dashboard/priority-pages")
async def get_priority_pages(
    crawl_id: Optional[str] = None,
    market: str = Query(default="global"),
    category: str = Query(default="all"),
    limit: int = Query(default=100, le=5000)
):
    """
    Get priority pages for internal linking based on technical gaps.
    
    This combines OnCrawl data with priority scoring.
    """
    # Get first live crawl if not specified
    if not crawl_id:
        live_crawls = oncrawl_client.get_live_crawls()
        if not live_crawls:
            raise HTTPException(status_code=404, detail="No live crawls available")
        crawl_id = live_crawls[0]['crawl_id']
    
    # Get pages with technical issues
    orphaned = oncrawl_client.get_orphaned_pages(crawl_id, limit=limit)
    low_inlinks = oncrawl_client.get_pages_with_low_inlinks(crawl_id, max_inlinks=3, limit=limit)
    deep_pages = oncrawl_client.get_deep_pages(crawl_id, min_depth=4, limit=limit)
    
    # Combine and deduplicate pages
    all_pages = {}
    
    # Process orphaned pages (highest priority)
    if not orphaned.get('error'):
        for page in orphaned.get('urls', []):
            url = page.get('url')
            if url and _matches_market(url, market):
                all_pages[url] = {
                    **page,
                    'technical_gaps': ['orphaned'],
                    'priority_score': _calculate_priority(page, ['orphaned'])
                }
    
    # Process low inlinks pages
    if not low_inlinks.get('error'):
        for page in low_inlinks.get('urls', []):
            url = page.get('url')
            if url and _matches_market(url, market):
                if url in all_pages:
                    all_pages[url]['technical_gaps'].append('low_inlinks')
                    all_pages[url]['priority_score'] = _calculate_priority(
                        page, all_pages[url]['technical_gaps']
                    )
                else:
                    all_pages[url] = {
                        **page,
                        'technical_gaps': ['low_inlinks'],
                        'priority_score': _calculate_priority(page, ['low_inlinks'])
                    }
    
    # Process deep pages
    if not deep_pages.get('error'):
        for page in deep_pages.get('urls', []):
            url = page.get('url')
            if url and _matches_market(url, market):
                if url in all_pages:
                    all_pages[url]['technical_gaps'].append('deep_page')
                    all_pages[url]['priority_score'] = _calculate_priority(
                        page, all_pages[url]['technical_gaps']
                    )
                else:
                    all_pages[url] = {
                        **page,
                        'technical_gaps': ['deep_page'],
                        'priority_score': _calculate_priority(page, ['deep_page'])
                    }
    
    # Sort by priority score
    sorted_pages = sorted(
        all_pages.values(),
        key=lambda x: x.get('priority_score', 0),
        reverse=True
    )[:limit]
    
    # Filter by category if specified
    if category != "all":
        sorted_pages = [p for p in sorted_pages if _matches_category(p, category)]
    
    return {
        'crawl_id': crawl_id,
        'market': market,
        'category': category,
        'pages': sorted_pages,
        'total': len(sorted_pages)
    }


@app.get("/api/dashboard/metrics")
async def get_dashboard_metrics(crawl_id: Optional[str] = None):
    """Get overview metrics for the dashboard."""
    # Get first live crawl if not specified
    if not crawl_id:
        live_crawls = oncrawl_client.get_live_crawls()
        if not live_crawls:
            raise HTTPException(status_code=404, detail="No live crawls available")
        crawl_id = live_crawls[0]['crawl_id']
    
    summary = oncrawl_client.get_technical_summary(crawl_id)
    
    # Get total pages count
    pages_result = oncrawl_client.query_pages(
        crawl_id=crawl_id,
        fields=['url'],
        limit=1,
        oql={
            'and': [
                {'field': ['fetched', 'equals', True]},
                {'field': ['status_code', 'equals', 200]}
            ]
        }
    )
    
    total_pages = pages_result.get('meta', {}).get('total_hits', 0) if not pages_result.get('error') else 0
    
    return {
        'crawl_id': crawl_id,
        'total_pages': total_pages,
        'orphaned_pages': summary.get('orphaned_count', 0),
        'low_inlinks_pages': summary.get('low_inlinks_count', 0),
        'deep_pages': summary.get('deep_pages_count', 0),
        'not_in_sitemap_pages': summary.get('not_in_sitemap_count', 0),
        'inlinks_distribution': summary.get('inlinks_distribution'),
        'depth_distribution': summary.get('depth_distribution')
    }


# ============== Helper Functions ==============

def _matches_market(url: str, market: str) -> bool:
    """Check if URL matches the specified market."""
    if market == "global":
        return True
    
    market_prefixes = {
        'us': ['/us/', '/en-us/', 'squareup.com/us'],
        'ca': ['/ca/', '/en-ca/', 'squareup.com/ca'],
        'gb': ['/gb/', '/en-gb/', 'squareup.com/gb'],
        'au': ['/au/', '/en-au/', 'squareup.com/au'],
        'ie': ['/ie/', '/en-ie/', 'squareup.com/ie'],
        'es': ['/es/', '/es-es/', 'squareup.com/es'],
        'jp': ['/jp/', '/ja-jp/', 'squareup.com/jp'],
        'fr': ['/fr/', '/fr-fr/', 'squareup.com/fr']
    }
    
    prefixes = market_prefixes.get(market.lower(), [])
    return any(prefix in url.lower() for prefix in prefixes)


def _matches_category(page: Dict, category: str) -> bool:
    """Check if page matches the specified category based on technical gaps."""
    gaps = page.get('technical_gaps', [])
    
    if category == "poor":
        # Poor performers: orphaned or multiple issues
        return 'orphaned' in gaps or len(gaps) >= 2
    elif category == "moderate":
        # Moderate: single issue, not orphaned
        return len(gaps) == 1 and 'orphaned' not in gaps
    
    return True


def _calculate_priority(page: Dict, technical_gaps: List[str]) -> float:
    """
    Calculate priority score based on technical gaps.
    
    Scoring weights (adjusted):
    - Low inlinks: 1.0 (highest priority - most actionable)
    - Orphaned page: 0.85 (high priority)
    - Deep page: 0.6
    - Multiple issues: bonus multiplier
    """
    base_score = 0
    
    gap_weights = {
        'low_inlinks': 1.0,      # Highest priority - most actionable
        'orphaned': 0.85,        # High priority
        'deep_page': 0.6,
        'not_in_sitemap': 0.4
    }
    
    for gap in technical_gaps:
        base_score += gap_weights.get(gap, 0.3)
    
    # Bonus for multiple issues
    if len(technical_gaps) > 1:
        base_score *= 1.2
    
    # Depth penalty (deeper = higher priority)
    depth = page.get('depth', 1)
    if depth > 3:
        base_score *= (1 + (depth - 3) * 0.1)
    
    # Normalize to 0-100 scale
    return min(round(base_score * 50, 1), 100)


# ============== Run Server ==============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
