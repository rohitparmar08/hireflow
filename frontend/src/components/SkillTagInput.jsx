import { useState } from 'react';

export default function SkillTagInput({
  tags = [],
  onChange,
  placeholder = 'Type a skill and press Enter or comma...',
  label,
  helperText,
  variant = 'primary',
  required = false,
}) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (val) => {
    const trimmed = val.trim();
    if (!trimmed) return;

    // Check if tag already exists (case-insensitive)
    const exists = tags.some((t) => t.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const parts = paste.split(/[,;\n]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      const newTags = [...tags];
      parts.forEach((p) => {
        if (!newTags.some((t) => t.toLowerCase() === p.toLowerCase())) {
          newTags.push(p);
        }
      });
      onChange(newTags);
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const pillStyles =
    variant === 'primary'
      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="min-h-[46px] p-2 bg-white rounded-xl border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition flex flex-wrap items-center gap-1.5">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${pillStyles}`}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="ml-1.5 text-slate-400 hover:text-slate-700 focus:outline-none"
            >
              &times;
            </button>
          </span>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => {
            if (inputValue.trim()) addTag(inputValue);
          }}
          placeholder={tags.length === 0 ? placeholder : 'Add more...'}
          className="flex-1 min-w-[140px] px-2 py-1 text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
        />
      </div>

      {helperText && (
        <span className="text-[11px] text-slate-400 block">{helperText}</span>
      )}
    </div>
  );
}
