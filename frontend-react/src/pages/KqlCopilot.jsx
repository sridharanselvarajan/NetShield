import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import {
  Sparkles,
  Copy,
  Check,
  Terminal,
  Search,
  ArrowRight,
  BookOpen,
  Loader2
} from 'lucide-react';

export default function KqlCopilot() {
  const [naturalQuery, setNaturalQuery] = useState('');
  const [generatedKql, setGeneratedKql] = useState('');
  const [copied, setCopied] = useState(false);
  const [explanation, setExplanation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // NEVER expose real production keys in frontend apps
  const OPENROUTER_API_KEY =
    import.meta.env.VITE_OPENROUTER_API_KEY;

  const samplePrompts = [
    {
      text: 'Find all Russian brute force threats',
      val: 'Find all Russian brute force threats'
    },
    {
      text: 'Sum blocked traffic volume by country',
      val: 'Sum blocked traffic volume by country'
    },
    {
      text: 'Search for critical DDoS attack spikes',
      val: 'Search for critical DDoS attack spikes'
    },
    {
      text: 'Show allowed internal network logs',
      val: 'Show allowed internal network logs'
    }
  ];

  // PURE LLM ENGINE
  const compileKql = async (queryText) => {
    if (!queryText.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'NetShield AI SOC'
          },
          body: JSON.stringify({
            model: 'nvidia/nemotron-3-super-120b-a12b:free',

            messages: [
              {
                role: 'system',
                content: `
You are an elite Microsoft Azure Sentinel KQL security engineer.

Convert user requests into VALID Microsoft Kusto Query Language (KQL).

Target table:
NetShieldTrafficLogs_CL

Schema:
- source_ip_s (string)
- dest_ip_s (string)
- dest_port_d (double)
- protocol_s (string)
- action_s (string: ALLOW or DENY)
- bytes_sent_d (double)
- packets_d (double)
- flow_type_s (string: normal, brute_force, port_scan, ddos)
- country_s (string)
- risk_score_d (double)
- is_anomaly_b (boolean)
- TimeGenerated (datetime)

RULES:
- Return ONLY valid JSON
- No markdown
- No code fences
- No explanations outside JSON
- Generate production-ready KQL
- Use proper Kusto syntax

Required response format:

{
  "kql": "valid kql query",
  "explanation": [
    "step 1",
    "step 2",
    "step 3"
  ]
}
`
              },
              {
                role: 'user',
                content: queryText
              }
            ],

            temperature: 0.2,
            max_tokens: 700
          })
        }
      );

      if (!response.ok) {
        throw new Error('OpenRouter request failed');
      }

      const result = await response.json();

      const rawContent =
        result?.choices?.[0]?.message?.content || '';

      // Clean accidental markdown wrappers and extract JSON securely
      const jsonStart = rawContent.indexOf('{');
      const jsonEnd = rawContent.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("Invalid JSON response from LLM");
      }
      const cleanContent = rawContent.substring(jsonStart, jsonEnd + 1).trim();
      const parsed = JSON.parse(cleanContent);

      setGeneratedKql(parsed.kql || '');
      setExplanation(parsed.explanation || []);
    } catch (error) {
      console.error('LLM Generation Error:', error);

      setGeneratedKql('');
      setExplanation([
        '❌ Failed to generate KQL using OpenRouter LLM.',
        'Check your API key, quota, model availability, or JSON formatting.'
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (val) => {
    setNaturalQuery(val);
    compileKql(val);
  };

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* LEFT PANEL */}
        <div className="md:col-span-1 flex flex-col gap-6">

          <GlassCard className="flex flex-col gap-5">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center text-[#00ff88]">
                <Sparkles
                  size={20}
                  className={isLoading ? 'animate-spin' : 'animate-pulse'}
                />
              </div>

              <div>
                <h2 className="text-base font-black text-white">
                  AI KQL Copilot
                </h2>

                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  OpenRouter LLM Engine
                </span>
              </div>

            </div>

            {/* INPUT */}
            <div className="flex flex-col gap-2">

              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Search Network Logs
              </span>

              <div className="relative">

                <input
                  type="text"
                  value={naturalQuery}
                  onChange={(e) =>
                    setNaturalQuery(e.target.value)
                  }
                  placeholder="e.g. Detect Russian brute force attacks..."
                  className="w-full bg-slate-950/80 border border-[rgba(255,255,255,0.06)] rounded-xl py-3 pl-4 pr-11 text-xs text-white placeholder-slate-600 outline-none focus:border-[#00ff88]/40 transition-colors"
                  disabled={isLoading}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    compileKql(naturalQuery)
                  }
                />

                <button
                  onClick={() => compileKql(naturalQuery)}
                  disabled={isLoading}
                  className="absolute right-2 top-2 w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-[#00ff88] transition-colors"
                >
                  {isLoading ? (
                    <Loader2
                      size={14}
                      className="animate-spin text-[#00ff88]"
                    />
                  ) : (
                    <Search size={14} />
                  )}
                </button>

              </div>

            </div>

            {/* QUICK PROMPTS */}
            <div className="flex flex-col gap-2">

              <span className="text-[10px] text-slate-500 font-black tracking-wider uppercase">
                Example Prompts
              </span>

              <div className="flex flex-col gap-2">

                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    disabled={isLoading}
                    onClick={() =>
                      handlePromptClick(p.val)
                    }
                    className="w-full text-left bg-slate-950/30 hover:bg-slate-950/60 border border-[rgba(255,255,255,0.04)] hover:border-[#00ff88]/20 p-3 rounded-lg text-[11px] text-slate-400 hover:text-white transition-all duration-200 flex justify-between items-center group"
                  >
                    <span>{p.text}</span>

                    <ArrowRight
                      size={10}
                      className="text-slate-600 group-hover:text-[#00ff88]"
                    />
                  </button>
                ))}

              </div>

            </div>

          </GlassCard>

        </div>

        {/* RIGHT PANEL */}
        <div className="md:col-span-2 flex flex-col gap-6">

          {/* GENERATED QUERY */}
          <GlassCard glowColor="rgba(0, 255, 136, 0.05)">

            <div className="flex justify-between items-center mb-4">

              <h2 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
                <Terminal
                  size={14}
                  className="text-[#00ff88]"
                />
                Generated KQL Query
              </h2>

              {generatedKql && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      generatedKql
                    );

                    setCopied(true);

                    setTimeout(
                      () => setCopied(false),
                      2000
                    );
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-white border border-[rgba(255,255,255,0.06)] px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5"
                >
                  {copied ? (
                    <Check
                      size={12}
                      className="text-[#00ff88]"
                    />
                  ) : (
                    <Copy size={12} />
                  )}

                  <span>
                    {copied ? 'Copied' : 'Copy Query'}
                  </span>
                </button>
              )}

            </div>

            {generatedKql ? (
              <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-950 font-mono text-[11px] text-[#00ff88] overflow-x-auto min-h-[160px] leading-relaxed whitespace-pre-wrap">
                {generatedKql}
              </div>
            ) : (
              <div className="bg-slate-950/20 p-5 rounded-xl border border-[rgba(255,255,255,0.04)] text-slate-600 italic text-center min-h-[160px] flex items-center justify-center text-xs">
                Enter a natural language query to generate Azure KQL using OpenRouter AI.
              </div>
            )}

          </GlassCard>

          {/* EXPLANATION */}
          <GlassCard glowColor="rgba(59, 130, 246, 0.05)">

            <h2 className="text-sm font-black text-white tracking-wide flex items-center gap-2 mb-4">
              <BookOpen
                size={14}
                className="text-blue-400"
              />
              Query Explanation
            </h2>

            {explanation.length > 0 ? (
              <div className="flex flex-col gap-3">

                {explanation.map((step, idx) => (
                  <div
                    key={idx}
                    className="text-xs font-semibold text-slate-400 border-b border-slate-950/30 pb-2"
                  >
                    {step}
                  </div>
                ))}

              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-500 italic text-center py-6">
                AI-generated query explanation will appear here.
              </p>
            )}

          </GlassCard>

        </div>

      </div>
    </div>
  );
}