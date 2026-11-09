import { RefreshCw, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import type { DataFreshnessMeta } from '../../types';

interface DataFreshnessBadgeProps {
  meta: DataFreshnessMeta | null;
  className?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

export default function DataFreshnessBadge({ meta, className = '' }: DataFreshnessBadgeProps) {
  if (!meta) return null;

  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs ${className}`}>
      {/* Source */}
      <div className="flex items-center gap-1 text-gray-500">
        <span className="font-medium text-gray-700">Source:</span>
        {meta.sourceUrl ? (
          <a
            href={meta.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 hover:underline inline-flex items-center gap-0.5"
          >
            {meta.source} <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span>{meta.source}</span>
        )}
      </div>

      {/* Last sync */}
      {meta.lastSynchronized ? (
        <div className="flex items-center gap-1 text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Last sync: {timeAgo(meta.lastSynchronized)}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-gray-400">
          <RefreshCw className="w-3 h-3" />
          <span>Not yet synced</span>
        </div>
      )}

      {/* API not configured warning */}
      {!meta.apiConfigured && (
        <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
          <AlertTriangle className="w-3 h-3" />
          <span>API key not configured — showing cached/demo data</span>
        </div>
      )}
    </div>
  );
}
