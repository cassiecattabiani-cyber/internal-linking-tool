"""
OnCrawl API Client for Internal Linking Tool
Uses the Data API: /api/v2/data/crawl/<crawl_id>/pages
"""

import requests
import os
from typing import Optional, Dict, List, Any
from dotenv import load_dotenv

load_dotenv()


class OnCrawlClient:
    """Client for interacting with OnCrawl's Data API."""
    
    def __init__(self, api_token: Optional[str] = None):
        self.api_token = api_token or os.getenv('ONCRAWL_API_TOKEN')
        self.base_url = "https://app.oncrawl.com/api/v2"
        self.headers = {
            'Authorization': f'Bearer {self.api_token}',
            'Content-Type': 'application/json'
        }
    
    def test_connection(self) -> Dict[str, Any]:
        """Test API connection by fetching projects."""
        try:
            resp = requests.get(
                f"{self.base_url}/projects",
                headers=self.headers,
                timeout=30
            )
            if resp.status_code == 200:
                projects = resp.json().get('projects', [])
                return {
                    'success': True,
                    'message': f'Connected successfully. Found {len(projects)} projects.',
                    'project_count': len(projects)
                }
            else:
                return {
                    'success': False,
                    'message': f'API returned status {resp.status_code}',
                    'error': resp.text
                }
        except Exception as e:
            return {
                'success': False,
                'message': f'Connection failed: {str(e)}',
                'error': str(e)
            }
    
    def get_projects(self) -> List[Dict[str, Any]]:
        """Get all projects."""
        resp = requests.get(
            f"{self.base_url}/projects",
            headers=self.headers,
            timeout=30
        )
        if resp.status_code == 200:
            return resp.json().get('projects', [])
        return []
    
    def get_crawl_details(self, crawl_id: str) -> Optional[Dict[str, Any]]:
        """Get details for a specific crawl."""
        resp = requests.get(
            f"{self.base_url}/crawls/{crawl_id}",
            headers=self.headers,
            timeout=30
        )
        if resp.status_code == 200:
            return resp.json().get('crawl', {})
        return None
    
    def get_live_crawls(self) -> List[Dict[str, Any]]:
        """Get all live crawls across all projects."""
        live_crawls = []
        projects = self.get_projects()
        
        for project in projects:
            last_crawl_id = project.get('last_crawl_id')
            if last_crawl_id:
                crawl = self.get_crawl_details(last_crawl_id)
                if crawl and crawl.get('link_status') == 'live':
                    live_crawls.append({
                        'project_id': project.get('id'),
                        'project_name': project.get('name'),
                        'crawl_id': last_crawl_id,
                        'status': crawl.get('status'),
                        'link_status': crawl.get('link_status'),
                        'crawl_config': crawl.get('crawl_config', {})
                    })
        
        return live_crawls
    
    def get_page_fields(self, crawl_id: str) -> List[Dict[str, Any]]:
        """Get available fields for page data."""
        resp = requests.get(
            f"{self.base_url}/data/crawl/{crawl_id}/pages/fields",
            headers=self.headers,
            timeout=30
        )
        if resp.status_code == 200:
            return resp.json().get('fields', [])
        return []
    
    def query_pages(
        self,
        crawl_id: str,
        fields: List[str] = None,
        oql: Dict[str, Any] = None,
        sort: List[Dict[str, str]] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Query page data from a crawl.
        
        Args:
            crawl_id: The crawl ID to query
            fields: List of fields to return (e.g., ['url', 'nb_inlinks', 'depth'])
            oql: OnCrawl Query Language filter object
            sort: Sort specification (e.g., [{'field': 'nb_inlinks', 'order': 'asc'}])
            limit: Max results to return (default 100)
            offset: Pagination offset
            
        Returns:
            Dict with 'urls' (list of pages), 'meta' (total_hits, etc.)
        """
        if fields is None:
            fields = ['url', 'nb_inlinks', 'depth', 'status_code', 'title']
        
        payload = {
            'offset': offset,
            'limit': limit,
            'fields': fields
        }
        
        if oql:
            payload['oql'] = oql
        
        if sort:
            payload['sort'] = sort
        
        resp = requests.post(
            f"{self.base_url}/data/crawl/{crawl_id}/pages",
            headers=self.headers,
            json=payload,
            timeout=60
        )
        
        if resp.status_code == 200:
            return resp.json()
        elif resp.status_code == 409:
            return {
                'error': True,
                'message': 'Crawl is archived. Only live crawls can be queried.',
                'status_code': 409
            }
        else:
            return {
                'error': True,
                'message': resp.text,
                'status_code': resp.status_code
            }
    
    def get_pages_with_low_inlinks(
        self,
        crawl_id: str,
        max_inlinks: int = 3,
        limit: int = 1000
    ) -> Dict[str, Any]:
        """Get pages with low internal links (1-3 inlinks, not orphaned)."""
        return self.query_pages(
            crawl_id=crawl_id,
            fields=['url', 'nb_inlinks', 'depth', 'status_code', 'title', 'word_count'],
            oql={
                'and': [
                    {'field': ['fetched', 'equals', True]},
                    {'field': ['status_code', 'equals', 200]},
                    {'field': ['nb_inlinks', 'gt', 0]},  # More than 0 (not orphaned)
                    {'field': ['nb_inlinks', 'lte', max_inlinks]}  # Up to max_inlinks
                ]
            },
            sort=[{'field': 'nb_inlinks', 'order': 'asc'}],
            limit=limit
        )
    
    def get_orphaned_pages(self, crawl_id: str, limit: int = 1000) -> Dict[str, Any]:
        """Get orphaned pages (0 inlinks)."""
        return self.query_pages(
            crawl_id=crawl_id,
            fields=['url', 'nb_inlinks', 'depth', 'status_code', 'title', 'word_count'],
            oql={
                'and': [
                    {'field': ['fetched', 'equals', True]},
                    {'field': ['status_code', 'equals', 200]},
                    {'field': ['nb_inlinks', 'equals', 0]}
                ]
            },
            sort=[{'field': 'depth', 'order': 'desc'}],
            limit=limit
        )
    
    def get_deep_pages(
        self,
        crawl_id: str,
        min_depth: int = 4,
        limit: int = 1000
    ) -> Dict[str, Any]:
        """Get pages with high crawl depth."""
        return self.query_pages(
            crawl_id=crawl_id,
            fields=['url', 'nb_inlinks', 'depth', 'status_code', 'title'],
            oql={
                'and': [
                    {'field': ['fetched', 'equals', True]},
                    {'field': ['status_code', 'equals', 200]},
                    {'field': ['depth', 'gte', min_depth]}  # Fixed: use 'gte' not 'greater_than'
                ]
            },
            sort=[{'field': 'depth', 'order': 'desc'}],
            limit=limit
        )
    
    def get_links(
        self,
        crawl_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Query link data from a crawl."""
        payload = {
            'offset': offset,
            'limit': limit,
            'fields': ['origin', 'destination', 'follow', 'type']
        }
        
        resp = requests.post(
            f"{self.base_url}/data/crawl/{crawl_id}/links",
            headers=self.headers,
            json=payload,
            timeout=60
        )
        
        if resp.status_code == 200:
            return resp.json()
        else:
            return {
                'error': True,
                'message': resp.text,
                'status_code': resp.status_code
            }
    
    def aggregate_pages(
        self,
        crawl_id: str,
        aggs: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Run aggregate queries on page data.
        
        Args:
            crawl_id: The crawl ID
            aggs: List of aggregation queries
            
        Example aggs:
            [{'fields': [{'name': 'depth'}], 'value': 'nb_inlinks:avg'}]
        """
        resp = requests.post(
            f"{self.base_url}/data/crawl/{crawl_id}/pages/aggs",
            headers=self.headers,
            json={'aggs': aggs},
            timeout=60
        )
        
        if resp.status_code == 200:
            return resp.json()
        else:
            return {
                'error': True,
                'message': resp.text,
                'status_code': resp.status_code
            }
    
    def get_inlinks_distribution(self, crawl_id: str) -> Dict[str, Any]:
        """Get distribution of pages by inlink count ranges."""
        return self.aggregate_pages(
            crawl_id=crawl_id,
            aggs=[{
                'fields': [{
                    'name': 'nb_inlinks',
                    'ranges': [
                        {'name': '0', 'to': 1},
                        {'name': '1-3', 'from': 1, 'to': 4},
                        {'name': '4-10', 'from': 4, 'to': 11},
                        {'name': '11-50', 'from': 11, 'to': 51},
                        {'name': '50+', 'from': 51}
                    ]
                }],
                'oql': {
                    'and': [
                        {'field': ['fetched', 'equals', True]},
                        {'field': ['status_code', 'equals', 200]}
                    ]
                }
            }]
        )
    
    def get_depth_distribution(self, crawl_id: str) -> Dict[str, Any]:
        """Get distribution of pages by crawl depth."""
        return self.aggregate_pages(
            crawl_id=crawl_id,
            aggs=[{
                'fields': [{'name': 'depth'}],
                'oql': {
                    'and': [
                        {'field': ['fetched', 'equals', True]},
                        {'field': ['status_code', 'equals', 200]}
                    ]
                }
            }]
        )
    
    def get_pages_not_in_sitemap(
        self,
        crawl_id: str,
        limit: int = 100
    ) -> Dict[str, Any]:
        """Get pages that are not in the sitemap."""
        return self.query_pages(
            crawl_id=crawl_id,
            fields=['url', 'nb_inlinks', 'depth', 'status_code', 'title', 'in_sitemap'],
            oql={
                'and': [
                    {'field': ['fetched', 'equals', True]},
                    {'field': ['status_code', 'equals', 200]},
                    {'field': ['in_sitemap', 'equals', False]}
                ]
            },
            sort=[{'field': 'nb_inlinks', 'order': 'asc'}],
            limit=limit
        )
    
    def get_technical_summary(self, crawl_id: str) -> Dict[str, Any]:
        """Get a technical SEO summary for a crawl."""
        summary = {
            'crawl_id': crawl_id,
            'inlinks_distribution': None,
            'depth_distribution': None,
            'orphaned_count': 0,
            'low_inlinks_count': 0,
            'deep_pages_count': 0,
            'not_in_sitemap_count': 0
        }
        
        # Get inlinks distribution
        inlinks_dist = self.get_inlinks_distribution(crawl_id)
        if not inlinks_dist.get('error'):
            summary['inlinks_distribution'] = inlinks_dist
        
        # Get depth distribution
        depth_dist = self.get_depth_distribution(crawl_id)
        if not depth_dist.get('error'):
            summary['depth_distribution'] = depth_dist
        
        # Count orphaned pages
        orphaned = self.get_orphaned_pages(crawl_id, limit=1)
        if not orphaned.get('error'):
            summary['orphaned_count'] = orphaned.get('meta', {}).get('total_hits', 0)
        
        # Count low inlinks pages
        low_inlinks = self.get_pages_with_low_inlinks(crawl_id, max_inlinks=3, limit=1)
        if not low_inlinks.get('error'):
            summary['low_inlinks_count'] = low_inlinks.get('meta', {}).get('total_hits', 0)
        
        # Count deep pages
        deep = self.get_deep_pages(crawl_id, min_depth=4, limit=1)
        if not deep.get('error'):
            summary['deep_pages_count'] = deep.get('meta', {}).get('total_hits', 0)
        
        # Count pages not in sitemap
        not_in_sitemap = self.get_pages_not_in_sitemap(crawl_id, limit=1)
        if not not_in_sitemap.get('error'):
            summary['not_in_sitemap_count'] = not_in_sitemap.get('meta', {}).get('total_hits', 0)
        
        return summary


# Quick test
if __name__ == '__main__':
    client = OnCrawlClient()
    
    print("Testing OnCrawl Client...")
    print()
    
    # Test connection
    result = client.test_connection()
    print(f"Connection: {result['message']}")
    print()
    
    # Get live crawls
    live_crawls = client.get_live_crawls()
    print(f"Found {len(live_crawls)} live crawls:")
    for crawl in live_crawls:
        print(f"  - {crawl['project_name']}: {crawl['crawl_id']}")
    print()
    
    if live_crawls:
        # Test with first live crawl
        test_crawl = live_crawls[0]
        crawl_id = test_crawl['crawl_id']
        print(f"Testing with: {test_crawl['project_name']}")
        print()
        
        # Get technical summary
        summary = client.get_technical_summary(crawl_id)
        print(f"Technical Summary:")
        print(f"  Orphaned pages: {summary['orphaned_count']}")
        print(f"  Low inlinks pages (≤3): {summary['low_inlinks_count']}")
        print(f"  Deep pages (depth ≥4): {summary['deep_pages_count']}")
