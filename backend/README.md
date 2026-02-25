# Internal Linking Tool - Backend

Python FastAPI backend for OnCrawl data integration.

## Setup

### 1. Create Environment File

Create a `.env` file in the `backend` folder with your credentials:

```
ONCRAWL_API_TOKEN=your_oncrawl_api_token_here
ONCRAWL_PROJECT_ID=your_project_id_here
```

### 2. Activate Virtual Environment

```bash
cd backend
source venv/bin/activate
```

### 3. Run the Server

```bash
python main.py
```

Or use the helper script:
```bash
./run.sh run
```

The API will be available at: http://127.0.0.1:8000

## API Documentation

Once running, view the interactive API docs at:
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API status |
| `/health` | GET | Health check |
| `/api/config/test` | GET | Test OnCrawl connection |
| `/api/oncrawl/projects` | GET | List all projects |
| `/api/oncrawl/crawls` | GET | List crawls for a project |
| `/api/oncrawl/crawls/latest` | GET | Get most recent crawl |
| `/api/oncrawl/pages/inlinks` | GET | Get pages with inlink counts |
| `/api/oncrawl/pages/low-inlinks` | GET | Get pages below inlink threshold |
| `/api/oncrawl/pages/orphaned` | GET | Get orphaned pages (0 inlinks) |
| `/api/oncrawl/pages/not-in-sitemap` | GET | Get pages missing from sitemap |
| `/api/oncrawl/pages/deep` | GET | Get pages with high crawl depth |
| `/api/oncrawl/summary` | GET | Get technical issues summary |
| `/api/dashboard/pages` | GET | Get formatted data for dashboard |

## Testing the Connection

```bash
./run.sh test
```

Or via API:
```bash
curl http://127.0.0.1:8000/api/config/test
```
