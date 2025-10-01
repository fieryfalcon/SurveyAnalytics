# Survey Analytics Dashboard

A Next.js frontend application for visualizing survey analytics and insights.

## Features

### Home Dashboard

- **KPI Metrics**:

  - Total Questions
  - Total Surveys
  - Total Responses
  - Active Surveys
  - Average Number of Questions
  - Response Percentage
  - Top Department
  - Top Category

- **Visualizations**:
  - Top Categories by Department (Table)
  - Response-wise Category Breakdown (Table)
  - Department-wise Breakdown (Bar Chart)
  - Category-wise Breakdown (Pie Chart)

### Survey Analytics (Coming Soon)

- Detailed per-survey analytics
- Individual survey performance metrics
- Response drill-down

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Port**: 3001 (Frontend), 3978 (Backend API)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running on port 3978

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Run the development server
npm run dev
```

The application will be available at [http://localhost:3001](http://localhost:3001)

### Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

The dashboard fetches data from the following backend endpoints:

- `GET /analytics/stats` - Dashboard KPI statistics
- `GET /analytics/department-breakdown` - Survey count by department
- `GET /analytics/category-breakdown` - Survey count by category
- `GET /analytics/top-categories-by-department` - Top categories for each department
- `GET /analytics/response-breakdown-by-category` - Response statistics by category

## Project Structure

```
analytics_frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home dashboard page
│   ├── analytics/
│   │   └── page.tsx        # Survey analytics page
│   └── globals.css         # Global styles
├── components/
│   └── Sidebar.tsx         # Sidebar navigation
├── next.config.ts          # Next.js configuration
└── package.json
```

## Configuration

### API Proxy

The frontend proxies API requests to the backend through Next.js rewrites (configured in `next.config.ts`):

```typescript
async rewrites() {
  return [
    {
      source: '/analytics/:path*',
      destination: 'http://localhost:3978/analytics/:path*',
    },
  ];
}
```

This allows the frontend to make requests to `/analytics/*` which are automatically forwarded to the backend API.

## Development Notes

- The dashboard is designed to work without authentication for simplicity
- All data is fetched client-side using React hooks
- Charts are responsive and adapt to screen size
- The sidebar provides navigation between different views
