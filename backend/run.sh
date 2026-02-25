#!/bin/bash

# Internal Linking Tool - Backend Runner
# Usage: ./run.sh [setup|run|test]

cd "$(dirname "$0")"

case "$1" in
    setup)
        echo "🔧 Setting up Python virtual environment..."
        python3 -m venv venv
        source venv/bin/activate
        echo "📦 Installing dependencies..."
        pip install -r requirements.txt
        echo "✅ Setup complete!"
        echo ""
        echo "Next steps:"
        echo "1. Create a .env file with your OnCrawl credentials:"
        echo "   ONCRAWL_API_TOKEN=your_token_here"
        echo "   ONCRAWL_PROJECT_ID=your_project_id_here"
        echo ""
        echo "2. Run the server with: ./run.sh run"
        ;;
    run)
        echo "🚀 Starting Internal Linking Tool API..."
        if [ -d "venv" ]; then
            source venv/bin/activate
        fi
        python main.py
        ;;
    test)
        echo "🧪 Testing OnCrawl API connection..."
        if [ -d "venv" ]; then
            source venv/bin/activate
        fi
        python -c "
from oncrawl_client import OnCrawlClient
client = OnCrawlClient()
result = client.test_connection()
print(result)
"
        ;;
    *)
        echo "Internal Linking Tool - Backend"
        echo ""
        echo "Usage: ./run.sh [command]"
        echo ""
        echo "Commands:"
        echo "  setup  - Create virtual environment and install dependencies"
        echo "  run    - Start the API server"
        echo "  test   - Test OnCrawl API connection"
        ;;
esac
