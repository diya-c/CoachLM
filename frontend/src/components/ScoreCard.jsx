// Displays a question's evaluation result: score, feedback, strengths/weaknesses
export default function ScoreCard({ evaluation, question }) {
  const score = evaluation?.score ?? 0
  const color =
    score >= 8 ? 'text-green-400 border-green-500/30 bg-green-500/10' :
    score >= 6 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
    'text-red-400 border-red-500/30 bg-red-500/10'

  return (
    <div className="card mt-4 space-y-4 animate-pulse-once">
      {/* Score header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-200">Answer Evaluation</h3>
        <span className={`score-badge border ${color} text-lg px-4 py-1.5`}>
          {score.toFixed(1)} / 10
        </span>
      </div>

      {/* Sub-scores */}
      {evaluation.correctness_score !== undefined && (
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          {[
            { label: 'Correctness', val: evaluation.correctness_score },
            { label: 'Relevance',   val: evaluation.relevance_score },
            { label: 'Clarity',     val: evaluation.clarity_score },
          ].map(({ label, val }) => (
            <div key={label} className="bg-gray-800 rounded-lg p-2">
              <div className="text-gray-400 text-xs">{label}</div>
              <div className="font-semibold text-gray-100 mt-0.5">{(val ?? 0).toFixed(1)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Strengths */}
      {evaluation.strengths && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <p className="text-xs text-green-400 font-semibold mb-1">✓ Strengths</p>
          <p className="text-gray-300 text-sm">{evaluation.strengths}</p>
        </div>
      )}

      {/* Weaknesses */}
      {evaluation.weaknesses && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-xs text-red-400 font-semibold mb-1">✗ Areas to Improve</p>
          <p className="text-gray-300 text-sm">{evaluation.weaknesses}</p>
        </div>
      )}

      {/* Overall feedback */}
      {evaluation.feedback && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-blue-400 font-semibold mb-1">💬 Feedback</p>
          <p className="text-gray-300 text-sm leading-relaxed">{evaluation.feedback}</p>
        </div>
      )}
    </div>
  )
}
