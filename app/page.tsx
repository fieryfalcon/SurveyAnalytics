"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import dynamic from 'next/dynamic';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Label mappings for better display
const CATEGORY_LABELS: Record<string, string> = {
  'photo_release': 'Photo Use Consent Form',
  'townhall': 'Town Hall Feedback',
  'grant': 'Grant Application',
  'event_feedback': 'Event Feedback',
  'employee_satisfaction': 'Employee Satisfaction',
  'training_feedback': 'Training Feedback',
  'general_survey': 'General Survey',
  'Unknown': 'Uncategorized'
};

// Helper function to format category labels
const formatCategoryLabel = (category: string): string => {
  return CATEGORY_LABELS[category] || category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface DashboardStats {
  total_questions: number;
  total_surveys: number;
  total_responses: number;
  active_surveys: number;
  avg_questions: number;
  response_percentage: number;
  top_department: string;
  top_category: string;
}

interface DepartmentData {
  department: string;
  survey_count: number;
}

interface CategoryData {
  category: string;
  count: number;
}

interface TopCategoryByDepartment {
  department: string;
  categories: { category: string; count: number }[];
  total_surveys: number;
}

interface ResponseBreakdown {
  category: string;
  target_users: number;
  responded_users: number;
  response_rate: number;
  survey_count: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategoryByDepartment[]>([]);
  const [responseBreakdown, setResponseBreakdown] = useState<ResponseBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  // Drill-down state for category chart
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryDrilldownData, setCategoryDrilldownData] = useState<{category: string, departments: {name: string, count: number}[]} | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const API_URL = 'https://accurately-living-phoenix.ngrok-free.app';
      console.log('🔗 Using API URL:', API_URL);
      
      const headers = { 'ngrok-skip-browser-warning': 'true' };
      
      const [statsRes, deptRes, catRes, topCatRes, respRes] = await Promise.all([
        fetch(`${API_URL}/analytics/stats`, { headers }),
        fetch(`${API_URL}/analytics/department-breakdown`, { headers }),
        fetch(`${API_URL}/analytics/category-breakdown`, { headers }),
        fetch(`${API_URL}/analytics/top-categories-by-department`, { headers }),
        fetch(`${API_URL}/analytics/response-breakdown-by-category`, { headers }),
      ]);

      if (!statsRes.ok) {
        console.error('Stats API error:', statsRes.status, await statsRes.text());
        throw new Error(`Failed to fetch stats: ${statsRes.status}`);
      }

      const statsData = await statsRes.json();
      const deptData = await deptRes.json();
      const catData = await catRes.json();
      const topCatData = await topCatRes.json();
      const respData = await respRes.json();

      setStats(statsData);
      setDepartmentData(deptData);
      setCategoryData(catData);
      setTopCategories(topCatData.departments || []);
      setResponseBreakdown(respData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ApexCharts options for Department Bar Chart
  const departmentChartOptions = {
    chart: {
      type: 'bar' as const,
      toolbar: { show: false },
      height: 350,
      background: 'transparent'
    },
    series: [{
      name: 'Number of Surveys',
      data: departmentData.map(d => d.survey_count)
    }],
    xaxis: {
      categories: departmentData.map(d => d.department),
      labels: { 
        style: { colors: '#6B7280', fontSize: '12px' },
        rotate: -45,
        rotateAlways: true
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { 
        style: { colors: '#6B7280', fontSize: '12px' },
        formatter: (value: number) => value.toFixed(0)
      }
    },
    colors: ['#9333EA'],
    plotOptions: {
      bar: { 
        borderRadius: 8,
        columnWidth: '60%',
        dataLabels: { position: 'top' }
      }
    },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: { fontSize: '12px', colors: ['#9333EA'] }
    },
    grid: { 
      borderColor: '#E5E7EB',
      strokeDashArray: 5,
      xaxis: { lines: { show: false } }
    },
    tooltip: { 
      theme: 'light',
      style: { fontSize: '12px' }
    }
  };

  // Handler for category drill-down
  const handleCategoryClick = (categoryIndex: number) => {
    const category = categoryData[categoryIndex];
    if (!category) return;

    // Find all departments with this category
    const departmentsWithCategory: {name: string, count: number}[] = [];

    topCategories.forEach(dept => {
      const categoryInDept = dept.categories.find(c => c.category === category.category);
      if (categoryInDept) {
        departmentsWithCategory.push({
          name: dept.department,
          count: categoryInDept.count
        });
      }
    });

    departmentsWithCategory.sort((a, b) => b.count - a.count);

    setSelectedCategory(category.category);
    setCategoryDrilldownData({
      category: category.category,
      departments: departmentsWithCategory
    });
  };

  // Reset drill-down
  const resetCategoryDrilldown = () => {
    setSelectedCategory(null);
    setCategoryDrilldownData(null);
  };

  // ApexCharts options for Category Donut Chart (with drill-down)
  const categoryChartOptions = {
    chart: {
      type: 'donut' as const,
      height: 350,
      background: 'transparent',
      events: {
        dataPointSelection: (_event: unknown, _chartContext: unknown, config: { dataPointIndex: number }) => {
          handleCategoryClick(config.dataPointIndex);
        }
      }
    },
    series: selectedCategory
      ? (categoryDrilldownData?.departments.map(d => d.count) || [])
      : categoryData.map(c => c.count),
    labels: selectedCategory
      ? (categoryDrilldownData?.departments.map(d => d.name) || [])
      : categoryData.map(c => formatCategoryLabel(c.category)),
    colors: ['#9333EA', '#A855F7', '#B17CF8', '#C084FC', '#D8B4FE', '#E9D5FF', '#F3E8FF'],
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: selectedCategory ? 'Total Surveys' : 'Total',
              fontSize: '16px',
              fontWeight: 600,
              color: '#9333EA',
              formatter: () => {
                if (selectedCategory) {
                  return (categoryDrilldownData?.departments.reduce((a, b) => a + b.count, 0) || 0).toString();
                }
                return categoryData.reduce((a, b) => a + b.count, 0).toString();
              }
            }
          }
        }
      }
    },
    legend: {
      position: 'bottom' as const,
      fontSize: '12px',
      markers: {
        size: 4,
        shape: 'circle' as const
      }
    },
    stroke: { width: 0 },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} surveys`
      }
    }
  };

  // ApexCharts options for Department Drill-down Bar Chart (unused)
  // const drilldownBarChartOptions = categoryDrilldownData ? {
  //   chart: {
  //     type: 'bar' as const,
  //     toolbar: { show: false },
  //     height: 300,
  //     background: 'transparent'
  //   },
  //   series: [{
  //     name: 'Number of Surveys',
  //     data: categoryDrilldownData.departments.map(d => d.count)
  //   }],
  //   xaxis: {
  //     categories: categoryDrilldownData.departments.map(d => d.name),
  //     labels: {
  //       style: { colors: '#6B7280', fontSize: '12px' },
  //       rotate: -45,
  //       rotateAlways: true
  //     },
  //     axisBorder: { show: false },
  //     axisTicks: { show: false }
  //   },
  //   yaxis: {
  //     labels: {
  //       style: { colors: '#6B7280', fontSize: '12px' },
  //       formatter: (value: number) => value.toFixed(0)
  //     }
  //   },
  //   colors: ['#9333EA'],
  //   plotOptions: {
  //     bar: {
  //       borderRadius: 8,
  //       columnWidth: '60%',
  //       dataLabels: { position: 'top' }
  //     }
  //   },
  //   dataLabels: {
  //     enabled: true,
  //     offsetY: -20,
  //     style: { fontSize: '12px', colors: ['#9333EA'] }
  //   },
  //   grid: {
  //     borderColor: '#E5E7EB',
  //     strokeDashArray: 5,
  //     xaxis: { lines: { show: false } }
  //   },
  //   tooltip: {
  //     theme: 'light',
  //     style: { fontSize: '12px' }
  //   }
  // } : null;

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 premium-gradient">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-2xl font-semibold text-gray-700">Loading...</div>
              <p className="text-gray-500 mt-2">Please wait while we prepare your experience</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 premium-gradient overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mr-4 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      Survey Analytics Dashboard
                    </h1>
                    <p className="text-base text-gray-600">Comprehensive overview of survey metrics and insights</p>
                  </div>
                </div>
                
              </div>
            </div>

            {/* Primary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="kpi-card card-hover">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Questions</h3>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-4xl font-bold text-gray-900">{stats?.total_questions || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Across all surveys</p>
              </div>

              <div className="kpi-card card-hover">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Surveys</h3>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-4xl font-bold text-gray-900">{stats?.total_surveys || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Created to date</p>
              </div>

              <div className="kpi-card card-hover">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Responses</h3>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-4xl font-bold text-gray-900">{stats?.total_responses || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Collected responses</p>
              </div>

              <div className="kpi-card card-hover">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Surveys</h3>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <p className="text-4xl font-bold text-gray-900">{stats?.active_surveys || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Currently active</p>
              </div>
            </div>

            {/* Secondary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 card-hover">
                <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Avg Questions</h3>
                <p className="text-3xl font-bold text-purple-600">{stats?.avg_questions || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Per survey</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 card-hover">
                <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Response Rate</h3>
                <div className="flex items-baseline">
                  <p className="text-3xl font-bold text-green-600">{stats?.response_percentage || 0}%</p>
                  <span className="ml-2 stat-badge stat-badge-positive">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Good
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 card-hover">
                <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Top Department</h3>
                <p className="text-2xl font-bold text-gray-900 truncate">{stats?.top_department || "N/A"}</p>
                <p className="text-sm text-gray-500 mt-2">Most active</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 card-hover">
                <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Top Category</h3>
                <p className="text-2xl font-bold text-gray-900 truncate">{stats?.top_category ? formatCategoryLabel(stats.top_category) : "N/A"}</p>
                <p className="text-sm text-gray-500 mt-2">Most used</p>
              </div>
            </div>

            {/* Data Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top Categories by Department */}
              <div className="chart-container card-hover">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  Top Categories by Department
                </h2>
                <div className="overflow-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Surveys</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {topCategories.map((dept, idx) => (
                        <tr key={idx} className="hover:bg-purple-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{dept.department}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">{dept.total_surveys}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Response Breakdown */}
              <div className="chart-container card-hover">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Response Breakdown by Category
                </h2>
                <div className="overflow-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Target</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Responded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {responseBreakdown.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCategoryLabel(item.category)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.target_users}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            <span className="font-semibold text-green-600">{item.responded_users}</span>
                            <span className="text-xs text-gray-500 ml-2">({item.response_rate}%)</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Bar Chart */}
              <div className="chart-container card-hover">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  Department-wise Distribution
                </h2>
                <div className="h-80">
                  {typeof window !== 'undefined' && (
                    <Chart
                      options={departmentChartOptions}
                      series={departmentChartOptions.series}
                      type="bar"
                      height={320}
                    />
                  )}
                </div>
              </div>

              {/* Category Donut Chart with Drill-down */}
              <div className="chart-container card-hover">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                      </svg>
                    </div>
                    {selectedCategory ? (
                      <span>
                        {formatCategoryLabel(selectedCategory)} <span className="text-sm text-gray-500">by Department</span>
                      </span>
                    ) : (
                      "Category Distribution"
                    )}
                  </h2>
                  {selectedCategory && (
                    <button
                      onClick={resetCategoryDrilldown}
                      className="flex items-center px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Overview
                    </button>
                  )}
                </div>
                {!selectedCategory && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">💡 Tip:</span> Click on any category slice to drill down and see department breakdown
                    </p>
                  </div>
                )}
                <div className="h-80">
                  {typeof window !== 'undefined' && categoryData.length > 0 && (
                    <Chart
                      options={categoryChartOptions}
                      series={categoryChartOptions.series}
                      type="donut"
                      height={320}
                      key={selectedCategory || 'main'}
                    />
                  )}
                </div>
                {selectedCategory && categoryDrilldownData && (
                  <div className="mt-6">
                    <h3 className="text-md font-semibold text-gray-800 mb-3">Department Breakdown</h3>
                    <div className="overflow-auto max-h-64">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Surveys</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {categoryDrilldownData.departments.map((dept, idx) => (
                            <tr key={idx} className="hover:bg-purple-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{dept.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">{dept.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}