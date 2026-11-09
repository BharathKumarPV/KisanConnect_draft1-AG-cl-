import { ExternalLink, Database } from 'lucide-react';

interface SourceBadgeProps {
  source: string;
  sourceUrl?: string;
  priceDate?: string;
  className?: string;
}

export default function SourceBadge({ source, sourceUrl, priceDate, className = '' }: SourceBadgeProps) {
  const label = source === 'demo-seed' ? 'AGMARKNET APMC' : source;

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs ${className}`}>
      <Database className="w-3 h-3 text-gray-400" />
      <span className="text-gray-500">Source:</span>
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-700 hover:underline inline-flex items-center gap-0.5 font-medium"
        >
          {label} <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <span className="font-medium text-gray-700">{label}</span>
      )}
      {priceDate && (
        <>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500">
            Data date: {new Date(priceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </>
      )}
    </div>
  );
}
