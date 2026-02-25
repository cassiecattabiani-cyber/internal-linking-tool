# Internal Linking Tool

An SEO dashboard for identifying underperforming pages and providing actionable interlink recommendations to strengthen semantic relevance and discoverability.

## 🚀 Live Demo

**Blockcell**: https://blockcell.sqprod.co/sites/internal-linking-tool/

## 📋 Features

### Dashboard
- **Metrics Overview**: Total pages, Poor Performers, Moderate/Well Performers
- **Priority Queue Table**: Sortable, filterable table with all page data
- **Dark Mode**: Toggle between light and dark themes
- **Export**: CSV export (PDF coming soon)

### Page Classification
- **Bucket 1 (Poor Performers)**: Pages with critical ranking drops
  - Position 1-3 → 4+ 
  - Position 4-10 → 11+
  - Drop 5+ positions in top 20
  - Drop 10+ positions in top 50
- **Bucket 2 (Moderate/Well Performers)**: Pages with technical gaps or moderate declines

### Page Detail Modal
- **Ranking History Chart**: Interactive Chart.js visualization with year selector
- **Technical Gaps Checklist**: Low inlinks, orphaned status, sitemap issues
- **Interlink Recommendations**: Relevance scores and suggested anchor text

### Configuration
- **API Configuration Panel**: SEMRush and OnCrawl API token inputs (placeholder)
- **Threshold Settings**: Configurable sliders for ranking drop, inlinks, search volume, priority cutoff

## 🛠️ Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, flexbox, grid, animations
- **JavaScript** - Vanilla JS (no framework dependencies)
- **Chart.js** - Interactive ranking history charts
- **Font Awesome** - Icons
- **Google Fonts** - Inter typeface

## 📁 Project Structure

```
internal-linking-tool/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styles (themes, components, responsive)
├── js/
│   └── app.js          # Application logic (data, rendering, interactions)
├── assets/             # Images and other static assets
├── README.md           # This file
└── .gitignore          # Git ignore rules
```

## 🚀 Getting Started

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/user/internal-linking-tool.git
   cd internal-linking-tool
   ```

2. Open in browser:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve
   
   # Or just open index.html directly
   open index.html
   ```

3. Visit `http://localhost:8000`

### Deployment to Blockcell

The site is automatically deployed to Blockcell. To manually deploy:

```bash
# Using Goose CLI or MCP tools
blockcell upload internal-linking-tool ./
```

## 🔧 Configuration

### API Integration (TODO)

The tool includes placeholder functions for:

- **SEMRush API**: Keyword rankings, YoY data, position tracking
- **OnCrawl API**: Technical SEO metrics (inlinks, orphaned pages, sitemap status)

To implement real API integration, update the functions in `js/app.js`:
- `testSemrushAPI()`
- `testOncrawlAPI()`
- `fetchSEMRushData(domain)`
- `fetchOnCrawlData(projectId)`

### Threshold Settings

Adjust these in the Settings panel:
- **Ranking Drop Threshold**: Positions dropped to trigger alert (default: 5)
- **Minimum Inlinks Required**: Pages below this are flagged (default: 3)
- **Search Volume Threshold**: Minimum search volume to consider (default: 500)
- **Priority Score Cutoff**: Score threshold for poor performers (default: 50)

## 📊 Priority Scoring Formula

```
Priority = (Bucket Weight) + (Rank Change Severity) + (Technical Gap Count × 5) + (Volume Bonus)

Where:
- Bucket 1 = +40 points
- Rank dropped 3+ positions = +20 points
- Each technical issue = +5 points
- Search volume > 1000 = +10 points
- Low inlinks (<3) = +15 points
```

## 🎨 Theming

The app supports light and dark modes via CSS custom properties. Toggle using the switch in the header.

### Color Palette
- **Accent**: #3b82f6 (Blue)
- **Success**: #10b981 (Green)
- **Warning**: #f59e0b (Yellow)
- **Error**: #ef4444 (Red)
- **Purple**: #8b5cf6 (Tech badges)

## 📝 Future Enhancements

- [ ] Real SEMRush API integration
- [ ] Real OnCrawl API integration
- [ ] PDF export functionality
- [ ] Semantic relevance engine (keyword overlap, topic modeling)
- [ ] Bulk actions for interlink recommendations
- [ ] Historical data persistence
- [ ] User authentication

## 👥 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Test locally
4. Submit a PR for review

## 📄 License

Internal use only - Block, Inc.
