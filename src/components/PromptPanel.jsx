import React, { useState } from 'react';
import { generatePrompt } from '../utils/prompts';
import SlideExample from './SlideExample';

const PromptPanel = ({ template, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState('example'); // example | prompt
  const prompt = generatePrompt(template);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(prompt)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        const ta = document.createElement('textarea');
        ta.value = prompt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-7 rounded border border-zinc-600" style={{ backgroundColor: template.style.bg }} />
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              {template.name}
              {template.mergedCount > 1 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">Merged {template.mergedCount}</span>
              )}
            </div>
            <div className="text-xs text-zinc-500">{template.category}</div>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-800 text-white text-xl flex items-center justify-center">
          ✕
        </button>
      </div>

      <div className="px-4 pt-3">
        <div className="inline-flex rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
          <button
            onClick={() => setTab('example')}
            className={`px-4 py-2 text-xs font-bold ${tab === 'example' ? 'bg-white text-black' : 'text-zinc-400'}`}
          >
            Preview
          </button>
          <button
            onClick={() => setTab('prompt')}
            className={`px-4 py-2 text-xs font-bold ${tab === 'prompt' ? 'bg-white text-black' : 'text-zinc-400'}`}
          >
            Prompt
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {tab === 'example' ? (
          <SlideExample template={template} />
        ) : (
          <textarea
            readOnly
            value={prompt}
            className="w-full min-h-[60vh] bg-zinc-900 text-zinc-300 text-xs font-mono p-4 rounded-xl border border-zinc-700 resize-none focus:outline-none"
            style={{ lineHeight: '1.6' }}
          />
        )}
      </div>

      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={handleCopy}
          className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 ${
            copied ? 'bg-green-600 text-white' : 'bg-white text-black'
          }`}
        >
          {copied ? '✓ Copied!' : '📋 Copy Prompt'}
        </button>
      </div>
    </div>
  );
};

export default PromptPanel;
