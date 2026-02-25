# 💡 Internal Linking Tool - Criteria Document v2

**Contributors:** Katie Calandra, Cassie Cattabiani, Jordan Kopman, Edward Kim

**Last Updated:** February 24, 2025

---

## API Credentials

> ⚠️ **SECURITY NOTE:** API tokens should never be stored in shared documents.

| Service | Credential Location |
|---------|---------------------|
| OnCrawl | Contact [Team Lead] or see 1Password vault |
| SEMRush | Contact [Team Lead] or see 1Password vault |

---

## 1. OBJECTIVE

Identify and prioritize underperforming pages for SEO optimization by analyzing ranking performance and technical gaps, then provide actionable interlink recommendations based on semantic relevance.

---

## 2. CORE FUNCTIONALITY

### 2.1 Data Collection & Integration

#### SEMRush API Integration
- Pull non-branded keyword rankings (current + historical YoY)
- Track position changes over time
- Filter out branded terms

#### OnCrawl API Integration
Extract technical SEO metrics per page:
- Internal link count (inlinks)
- Orphaned page status
- Sitemap inclusion status
- Page crawl data

#### Content Analysis
- Scrape/access page content for semantic analysis
- Extract main topics, keywords, entities

---

### 2.2 Page Classification & Prioritization

#### Bucket 1: Poor Performers (Highest Priority)

Pages with critical ranking drops, scored by severity:

| Drop Type | Description | Weight | Time Frame |
|-----------|-------------|--------|------------|
| Top 3 → Page 2+ | Positions 1-3 dropping to 4+ | **1.0** (Highest) | 30-day or YoY |
| Page 1 → Page 2+ | Positions 4-10 dropping to 11+ | **0.85** | 30-day or YoY |
| Significant Top 20 Drop | Drop of 5+ positions within top 20 | **0.6** | 30-day |
| Major Top 50 Drop | Drop of 10+ positions within top 50 | **0.4** | 30-day |

**Priority Score Formula:**
```
Priority Score = Drop Severity Weight × Search Volume × (1 + Technical Gap Count × 0.1)
```

#### Bucket 2: Moderate/Well Performers Needing Maintenance (Lower Priority)

Pages with moderate declines or technical gaps:

| Drop Type | Description | Weight | Time Frame |
|-----------|-------------|--------|------------|
| Minor Page 1 Drop | Drop of 3-4 positions in top 10 | **0.5** | 30-day |
| Moderate Drop | Drop of 5-9 positions in positions 11-50 | **0.4** | 30-day |
| Trending Decline | Consistent 1-2 position monthly decline | **0.6** | 3+ consecutive months |
| Technical Gap Only | Well-performing (top 10) with technical gaps | **0.3** | Current |

**Priority Score Formula:**
```
Priority Score = Opportunity Potential × Technical Gap Severity × 0.7
```

#### Exclusion Criteria

The following pages should be **excluded** from analysis:
- Pages with < 100 monthly search volume
- Non-indexable pages (noindex tag, canonicalized to another URL)
- Redirect URLs (3xx status)
- Pages less than 90 days old (insufficient data)
- Non-HTML resources (PDFs, images, etc.)
- Staging/development URLs

---

### 2.3 Technical Gap Analysis

For each flagged page, identify:

| Gap Type | Definition | Default Threshold |
|----------|------------|-------------------|
| **Low Inlinks** | Below site average or threshold | < 5 inlinks OR < 50% of site average (whichever is lower) |
| **Orphaned Page** | Not linked from any other page | 0 internal inlinks |
| **Sitemap Missing** | Not included in XML sitemap | Not in sitemap.xml |
| **Crawl Depth** | Too many clicks from homepage | > 4 clicks from homepage |

**Technical Gap Severity Score:**
| Number of Gaps | Severity Multiplier |
|----------------|---------------------|
| 1 gap | 1.0 |
| 2 gaps | 1.3 |
| 3 gaps | 1.6 |
| 4+ gaps | 2.0 |

---

### 2.4 Market/Region Segmentation

Filter analysis by URL path prefix to prioritize by region:

| Market | URL Path Prefix |
|--------|-----------------|
| Global | All pages (no filter) |
| United States | `/us/` |
| Australia | `/au/` |
| United Kingdom | `/gb/` |
| Canada | `/ca/` |
| Ireland | `/ie/` |
| Spain | `/es/` |
| Japan | `/jp/` |
| France | `/fr/` |

**Use Case:** Allows teams to focus optimization efforts on specific markets based on business priorities.

---

### 2.5 Semantic Relevance Engine

Build multi-method semantic matching:

#### Method 1: Keyword Overlap
- Extract target keywords from declining page
- Find pages with related keyword clusters
- Calculate overlap score

#### Method 2: Topic Modeling
- Use LDA or similar to identify topic distributions
- Match pages with similar topic profiles
- Calculate topic similarity score

#### Method 3: Content Embeddings (Optional Enhancement)
- Generate embeddings for page content
- Calculate cosine similarity between pages
- Identify semantically related content

#### Combined Scoring

| Method | Default Weight | Description |
|--------|----------------|-------------|
| Keyword Overlap | **40%** | Direct keyword matching |
| Topic Modeling | **35%** | Thematic similarity |
| Content Embeddings | **25%** | Deep semantic similarity |

**Final Relevance Score Formula:**
```
Relevance Score = (Keyword Overlap × 0.4) + (Topic Similarity × 0.35) + (Embedding Similarity × 0.25)
```

**Bonus Modifiers:**
- Source page in top 10 rankings: +15% bonus
- Source page has high authority (20+ inlinks): +10% bonus
- Same market/region: +5% bonus

---

### 2.6 Interlink Recommendations

For each declining/gap page, provide:

| Output | Description |
|--------|-------------|
| **Candidate Pages** | Top 10-20 pages to link from |
| **Relevance Score** | 0-100 scale based on semantic matching |
| **Source Page Performance** | Current ranking, traffic potential |
| **Suggested Anchor Text** | Based on target page keywords |

#### Anchor Text Generation Methodology

| Priority | Method | Example |
|----------|--------|---------|
| Primary | Target page's #1 ranking keyword | "payment processing solutions" |
| Secondary | Page title (truncated to 5-7 words) | "Accept Credit Card Payments" |
| Tertiary | Primary H1 heading | "Online Payment Gateway" |

**Anchor Text Rules:**
- Avoid exact match if target page already has 3+ exact match anchors (over-optimization risk)
- Prefer natural language variations
- Maximum anchor text length: 60 characters

---

## 3. OUTPUT REQUIREMENTS

### 3.1 Dashboard Components

#### Overview Metrics
- Total pages analyzed
- Pages in each bucket (Poor / Moderate)
- Total technical gaps identified
- Estimated traffic impact

#### Priority Queue
- Sortable table of pages by priority score
- Filters: bucket, technical issue type, ranking drop severity, market
- Search by URL

#### Page Detail View
- Ranking history chart (YoY comparison)
- Technical gaps checklist
- Interlink recommendations table
- Quick actions/export options

### 3.2 Report Format

#### Executive Summary
| Metric | Description |
|--------|-------------|
| Key Findings | Top issues identified |
| High-Priority Pages | Count of Bucket 1 pages |
| Expected Traffic Impact | Calculated recovery potential |

#### Expected Impact Calculation
```
Expected Impact = Σ (Search Volume × CTR at Target Position) - (Search Volume × CTR at Current Position)

Where CTR estimates:
- Position 1: 28.5%
- Position 2: 15.7%
- Position 3: 11.0%
- Positions 4-10: 2-8% (declining)
- Positions 11+: <2%
```

#### Detailed Page Reports
Per-page breakdown with:
- Current vs. YoY rankings
- Technical issues found
- Top interlink recommendations
- Implementation priority

#### Export Options
| Format | Use Case |
|--------|----------|
| CSV | Full data export for bulk processing |
| PDF | Executive-ready report |

---

## 4. TECHNICAL SPECIFICATIONS

### 4.1 Architecture Considerations

| Component | Specification |
|-----------|---------------|
| Language/Framework | Python (backend), HTML/CSS/JS (frontend) |
| Database | PostgreSQL or similar for historical data |
| APIs | Rate limiting and error handling for SEMRush/OnCrawl |
| Scalability | Handle large-scale sites (10,000+ pages) |
| Performance | Batch processing for semantic analysis |

### 4.2 Configuration Parameters

| Parameter | Default Value | Configurable |
|-----------|---------------|--------------|
| Ranking drop thresholds | See Section 2.2 | ✅ Yes |
| Inlink count threshold | 5 or 50% of average | ✅ Yes |
| Semantic similarity minimum | 0.3 (30%) | ✅ Yes |
| YoY comparison period | 12 months | ✅ Yes |
| Branded keyword patterns | [company name], [brand terms] | ✅ Yes |
| Recommendations per page | 10 | ✅ Yes (max 20) |
| Minimum search volume | 100 | ✅ Yes |

### 4.3 Data Refresh Schedule

| Data Type | Frequency | Notes |
|-----------|-----------|-------|
| Dashboard queries | Real-time | On user request |
| Priority pages (top 500) | Daily | High-priority monitoring |
| Full ranking data | Weekly | All pages |
| Technical crawl sync | Weekly | OnCrawl data |
| Semantic analysis | Weekly | Resource-intensive |
| Manual refresh | On-demand | User-triggered |

**API Rate Limit Considerations:**
- SEMRush: ~10,000 requests/day (verify with plan)
- OnCrawl: Check project limits
- Implement exponential backoff for rate limit errors

---

## 5. SUCCESS CRITERIA

| Criteria | Measurement |
|----------|-------------|
| ✅ Identifies ranking declines | Matches defined thresholds accurately |
| ✅ Flags technical gaps | Correctly pulls OnCrawl data |
| ✅ Generates relevant interlinks | Semantic score > 0.5 for top recommendations |
| ✅ Prioritizes by impact | Higher volume + larger drops = higher priority |
| ✅ Actionable recommendations | Clear anchor text + source pages |
| ✅ Handles scale | 10,000+ pages without timeout |
| ✅ Exports cleanly | CSV/PDF generation works |

---

## 6. DEPENDENCIES & REQUIREMENTS

| Dependency | Requirement |
|------------|-------------|
| SEMRush API | Valid credentials with sufficient quota |
| OnCrawl API | Credentials and project access |
| Website Content | Access for semantic analysis (or cached content) |
| Historical Data | Minimum 12 months for YoY comparison |
| Server Resources | Sufficient for batch processing |

---

## 7. REVISION HISTORY

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Initial | Original criteria document | Team |
| 2.0 | Feb 24, 2025 | Added: explicit weights, default thresholds, time frames, market segmentation, exclusion criteria, anchor text methodology, impact formulas, API rate limits | Cassie Cattabiani |

---

## 8. OPEN QUESTIONS

- [ ] Confirm SEMRush API daily quota limit
- [ ] Define branded keyword exclusion patterns for squareup.com
- [ ] Determine if content embeddings (Method 3) should be MVP or Phase 2
- [ ] Clarify stakeholder access levels for dashboard
