import HistoryView from '../components/HistoryView';

/**
 * History page showing past analyses
 */
export default function HistoryPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Analysis History
          </h2>
          <p className="text-gray-500 mt-1">
            View and manage your past content analysis reports.
          </p>
        </div>
      </div>

      <div className="glass rounded-xl p-6 border border-white/40 shadow-sm">
        <HistoryView />
      </div>
    </div>
  );
}
