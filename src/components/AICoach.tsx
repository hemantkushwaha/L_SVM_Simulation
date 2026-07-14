import { useState } from 'react';
import { Point, SVMParams, SVMResult } from '../types';
import { Sparkles, Loader2, Send, HelpCircle, MessageSquare } from 'lucide-react';
import Markdown from 'react-markdown';

interface AICoachProps {
  points: Point[];
  params: SVMParams;
  result: SVMResult | null;
}

export default function AICoach({ points, params, result }: AICoachProps) {
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleAskCoach = async (predefinedQuestion?: string) => {
    setLoading(true);
    setError(null);
    setExplanation('');

    const questionText = predefinedQuestion || customQuestion;

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points,
          params,
          metrics: result,
          question: questionText || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get explanation from AI Coach');
      }

      const data = await response.json();
      setExplanation(data.explanation || 'No response from the coach.');
      if (!predefinedQuestion) {
        setCustomQuestion('');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the AI Assistant. Please verify that your Gemini API key is configured correctly in Settings > Secrets.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
        <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 p-1.5 rounded-lg text-white">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">ML Lab AI Assistant</h3>
          <p className="text-[10px] text-slate-400">Powered by Gemini 3.5 Flash</p>
        </div>
      </div>

      {/* Suggestion Prompts */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
          Ask the Coach:
        </span>
        <div className="flex flex-col space-y-1">
          {[
            'Explain the current decision boundary geometry.',
            'Is my model overfitting or underfitting?',
            'What is the geometrical impact of making C larger?',
            'How can I separate concentric rings without errors?',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleAskCoach(prompt)}
              disabled={loading}
              className="text-left text-xs text-indigo-600 hover:text-indigo-800 hover:bg-slate-50 border border-slate-100 p-2 rounded-lg transition-colors bg-white font-medium cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea for custom question */}
      <div className="flex space-x-2 mt-2">
        <input
          type="text"
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder="Ask a custom SVM question (e.g. why is my accuracy 50%?)..."
          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 outline-none focus:bg-white focus:border-indigo-500 transition-colors shadow-inner"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAskCoach();
            }
          }}
        />
        <button
          onClick={() => handleAskCoach()}
          disabled={loading || !customQuestion.trim()}
          className="bg-indigo-600 text-white font-bold p-2 rounded-xl hover:bg-indigo-500 active:scale-95 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {/* Response Display */}
      {(explanation || loading || error) && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-3 max-h-[350px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-6 space-x-2 text-xs text-slate-500 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Analyzing boundary metrics and drawing insights...</span>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-600 leading-relaxed bg-red-50 p-3 border border-red-200/50 rounded-xl flex items-start space-x-2">
              <HelpCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {explanation && !loading && (
            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                <span>AI Coach Analysis</span>
              </div>
              <div className="markdown-body text-xs leading-relaxed text-slate-700">
                <Markdown>{explanation}</Markdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
