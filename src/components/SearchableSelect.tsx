import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string | number;
  label: string;
  tags?: string;
}

interface Props {
  options: Option[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchableSelect({ options, value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find((o) => String(o.value) === String(value))?.label || '';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter((o) => {
    const q = search.toLowerCase();
    return o.label.toLowerCase().includes(q) || (o.tags || '').toLowerCase().includes(q);
  });

  const handleSelect = (val: string | number) => {
    onChange(String(val));
    setOpen(false);
    setSearch('');
  };

  const renderTags = (tags?: string) => {
    if (!tags) return null;
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagList.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-0.5">
        {tagList.map((tag, i) => (
          <span key={i} className="inline-flex rounded-full bg-gray-100 px-1.5 py-0 text-[9px] text-gray-500">
            {tag}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="relative" ref={ref}>
      <div
        className="input cursor-pointer flex items-center justify-between"
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 50); }}
      >
        <span className={selectedLabel ? 'text-gray-900' : 'text-gray-400'}>
          {selectedLabel || placeholder || 'Select...'}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-brand-500"
              placeholder="🔍 ابحث / Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-56">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">No results</div>
            ) : (
              filtered.map((o) => (
                <div
                  key={o.value}
                  className={`px-4 py-2.5 cursor-pointer hover:bg-brand-50 transition-colors ${
                    String(o.value) === String(value) ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'
                  }`}
                  onClick={() => handleSelect(o.value)}
                >
                  <div className="text-sm">{o.label}</div>
                  {renderTags(o.tags)}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
