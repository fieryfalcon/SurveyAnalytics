"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import dynamic from "next/dynamic";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface QuestionAnalysis {
  question_id: string;
  question_number: number;
  question_text: string;
  question_type: string;
  original_type: string;
  options: string[];
  allow_multiple: boolean;
  response_count: number;
  analysis: Record<string, unknown>;
}

interface SurveyDetail {
  _id: string;
  title: string;
  description: string;
  template_key: string;
  creator_department: string;
  creator_name: string;
  status: string;
  created_at: string | null;
  expires_at: string | null;
  questions: QuestionAnalysis[];
  response_count: number;
  target_count: number;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

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

const formatCategoryLabel = (category: string): string => {
  return CATEGORY_LABELS[category] || category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function SurveyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSurveyDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSurveyDetail = async () => {
    try {
      setLoading(true);
      const API_URL = 'https://accurately-living-phoenix.ngrok-free.app';
      console.log(`Fetching survey detail for ID: ${id}`);
      const headers = { 'ngrok-skip-browser-warning': 'true' };
      const response = await fetch(`${API_URL}/analytics/surveys/${id}`, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        throw new Error(`Failed to fetch survey: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Survey data:', data);
      setSurvey(data);
      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching survey detail:", err);
      setError(err instanceof Error ? err.message : "Failed to load survey details");
    } finally {
      setLoading(false);
    }
  };

  const renderChoiceQuestion = (question: QuestionAnalysis) => {
    const analysis = question.analysis;
    const optionCounts = analysis?.option_counts || {};
    const optionPercentages = analysis?.option_percentages || {};

    // Prepare data for chart
    const labels = question.options;
    const counts = labels.map(opt => optionCounts[opt] || 0);
    const percentages = labels.map(opt => optionPercentages[opt] || 0);

    const chartOptions = {
      chart: {
        type: 'bar' as const,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 8,
          dataLabels: { position: 'right' as const }
        }
      },
      colors: ['#f97316'],
      dataLabels: {
        enabled: true,
        formatter: function(val: number, opts: { dataPointIndex: number }) {
          return `${val} (${percentages[opts.dataPointIndex]}%)`;
        },
        style: {
          fontSize: '12px',
          colors: ['#1f2937']
        },
        offsetX: 30
      },
      xaxis: {
        categories: labels,
        title: { text: 'Number of Responses' }
      },
      yaxis: {
        labels: {
          style: { fontSize: '12px' }
        }
      },
      tooltip: {
        y: {
          formatter: function(val: number, opts: { dataPointIndex: number }) {
            return `${val} responses (${percentages[opts.dataPointIndex]}%)`;
          }
        }
      }
    };

    const series = [{ name: 'Responses', data: counts }];

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <Chart options={chartOptions} series={series} type="bar" height={Math.max(250, labels.length * 50)} />
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          {labels.map((option, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
              <span className="font-medium text-gray-700">{option}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{counts[idx]} responses</span>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                  {percentages[idx]}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRatingQuestion = (question: QuestionAnalysis) => {
    const analysis = question.analysis;
    const average = analysis?.average || 0;
    const ratingMin = analysis?.rating_min || 1;
    const ratingMax = analysis?.rating_max || 5;
    const distribution = analysis?.rating_distribution || {};

    // Prepare data for chart
    const labels = [];
    const counts = [];
    for (let i = ratingMin; i <= ratingMax; i++) {
      labels.push(i.toString());
      counts.push(distribution[i.toString()] || 0);
    }

    const chartOptions = {
      chart: {
        type: 'bar' as const,
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: '60%'
        }
      },
      colors: ['#3b82f6'],
      dataLabels: {
        enabled: true,
        style: { fontSize: '12px', colors: ['#1f2937'] }
      },
      xaxis: {
        categories: labels,
        title: { text: 'Rating' }
      },
      yaxis: {
        title: { text: 'Number of Responses' }
      },
      tooltip: {
        y: {
          formatter: function(val: number) {
            return `${val} responses`;
          }
        }
      }
    };

    const series = [{ name: 'Responses', data: counts }];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{average.toFixed(2)}</div>
            <div className="text-sm text-gray-600 mt-1">Average Rating</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{ratingMax}</div>
            <div className="text-sm text-gray-600 mt-1">Max Rating</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{ratingMin}</div>
            <div className="text-sm text-gray-600 mt-1">Min Rating</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <Chart options={chartOptions} series={series} type="bar" height={300} />
        </div>
      </div>
    );
  };

  const renderTextQuestion = (question: QuestionAnalysis) => {
    const analysis = question.analysis;
    const textResponses = analysis?.text_responses || [];
    const avgLength = analysis?.average_length || 0;

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
          <div className="text-2xl font-bold text-indigo-600">{avgLength.toFixed(1)} characters</div>
          <div className="text-sm text-gray-600 mt-1">Average Response Length</div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700">Text Responses ({textResponses.length})</h4>
          {textResponses.length === 0 ? (
            <p className="text-gray-500 italic">No text responses yet</p>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {textResponses.map((response: string, idx: number) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-gray-700">{response}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 premium-gradient">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-2xl font-semibold text-gray-700">Loading Survey Details...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 premium-gradient">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-24 h-24 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Survey Not Found</h2>
              <p className="text-gray-600 mb-4">{error || "The requested survey could not be found."}</p>
              <a href="/analytics" className="text-orange-600 hover:text-orange-700 font-semibold">
                ← Back to Survey List
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const completionRate = survey.target_count > 0 
    ? ((survey.response_count / survey.target_count) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 premium-gradient overflow-auto">
    <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <a href="/analytics" className="text-orange-600 hover:text-orange-700 font-semibold mb-4 inline-block">
                ← Back to Survey List
              </a>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{survey.title}</h1>
                  <p className="text-lg text-gray-600 mb-4">{survey.description}</p>
                  
                  <div className="flex flex-wrap gap-3">
                    <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                      {formatCategoryLabel(survey.template_key)}
                    </span>
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                      {survey.creator_department}
                    </span>
                    <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      survey.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {survey.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Responses</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{survey.response_count}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Target Count</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{survey.target_count}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Completion Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{completionRate}%</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Questions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{survey.questions.length}</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Survey Metadata */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Survey Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Created By</p>
                  <p className="text-gray-900 mt-1">{survey.creator_name}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Created At</p>
                  <p className="text-gray-900 mt-1">{formatDate(survey.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Expires At</p>
                  <p className="text-gray-900 mt-1">{formatDate(survey.expires_at)}</p>
                </div>
              </div>
            </div>

            {/* Questions with Analytics */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Question Analytics</h2>
              
              {survey.questions.map((question) => (
                <div key={question.question_id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="mb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-sm font-bold">
                            Q{question.question_number}
                          </span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold uppercase">
                            {question.question_type}
                          </span>
                          {question.allow_multiple && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold uppercase">
                              Multiple Choice
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{question.question_text}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600">{question.response_count}</div>
                        <div className="text-sm text-gray-600">Responses</div>
                      </div>
                    </div>
                  </div>

                  {question.response_count === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-500 font-medium">No responses yet for this question</p>
                    </div>
                  ) : (
                    <>
                      {(question.question_type === 'single_choice' || question.question_type === 'multiple_choice') && renderChoiceQuestion(question)}
                      {question.question_type === 'rating' && renderRatingQuestion(question)}
                      {question.question_type === 'text' && renderTextQuestion(question)}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
