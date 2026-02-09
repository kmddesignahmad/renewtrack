import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function NoticePage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [notice, setNotice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!uuid) return;
    fetch(`/api/notices/${uuid}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(setNotice)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [uuid]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (notFound || !notice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="text-lg font-semibold text-gray-900">Notice Not Found</h2>
          <p className="text-sm text-gray-500 mt-1">This renewal notice does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Print button */}
        <div className="no-print mb-4 text-right">
          <button
            onClick={() => window.print()}
            className="btn-primary"
          >
            🖨️ Print Notice
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-800 to-brand-600 px-8 py-6">
            <div className="flex items-center gap-4">
              <img
                src="https://dcv.jo/wp-content/uploads/2024/12/logo-Digital-Creative-for-Information-Technology-02.png"
                alt="DCV Logo"
                className="h-14 w-auto bg-white rounded-lg p-1"
                crossOrigin="anonymous"
              />
              <div className="text-white">
                <h1 className="text-xl font-bold">Digital Creative Vision</h1>
                <p className="text-brand-200 text-sm">For Information Technology</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="px-8 py-5 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 text-center">RENEWAL NOTICE</h2>
            <p className="text-xs text-gray-400 text-center mt-1">
              Date: {notice.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]}
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-6 space-y-6">
            {/* Customer */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2 tracking-wider">Customer</h3>
              <p className="text-lg font-semibold text-gray-900">{notice.customer_name}</p>
            </div>

            {/* Details table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 bg-gray-50 font-medium text-gray-600 w-40">Service</td>
                    <td className="px-4 py-3 text-gray-900">{notice.service_name}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 bg-gray-50 font-medium text-gray-600">Domain / Service</td>
                    <td className="px-4 py-3 text-gray-900 font-mono">{notice.domain_or_service}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 bg-gray-50 font-medium text-gray-600">Renewal Date</td>
                    <td className="px-4 py-3 text-gray-900 font-semibold">{notice.end_date}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 bg-gray-50 font-medium text-gray-600">Amount Due</td>
                    <td className="px-4 py-3 text-xl font-bold text-brand-600">{notice.price} {notice.currency}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              This is a renewal notice for the above service. Please ensure payment is made before the renewal date to avoid service interruption.
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100">
            <div className="text-center text-xs text-gray-500 space-y-1">
              <p className="font-medium text-gray-700">Digital Creative Vision For Information Technology</p>
              <p>Jordan – Amman | Mobile: 00962796370060</p>
              <p>Email: info@dcv.jo | Website: dcv.jo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
