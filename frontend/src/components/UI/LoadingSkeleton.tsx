interface LoadingSkeletonProps {
  rows?: number;
  cols?: number;
  type?: 'table' | 'card' | 'text';
}

export default function LoadingSkeleton({ rows = 5, cols = 5, type = 'table' }: LoadingSkeletonProps) {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="card p-4 space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="table-container animate-pulse">
      <table className="table-base">
        <thead className="table-head">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="table-th">
                <div className="h-3 bg-gray-300 rounded w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="table-td">
                  <div className="h-4 bg-gray-200 rounded" style={{ width: `${40 + (j * 20) % 50}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
