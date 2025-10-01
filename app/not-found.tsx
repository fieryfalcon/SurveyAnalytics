export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mt-4">Page Not Found</p>
        <p className="text-sm text-gray-500 mt-2">The page you're looking for doesn't exist.</p>
        <a href="/" className="mt-6 inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
          Go Home
        </a>
      </div>
    </div>
  );
}
