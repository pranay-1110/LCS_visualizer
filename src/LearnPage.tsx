import { useNavigate } from "react-router-dom";

export default function LearnPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center px-6 py-10 text-gray-800">
      <div className="max-w-3xl bg-white shadow-xl rounded-2xl p-8 space-y-5 border border-gray-200">
        <h1 className="text-3xl font-bold text-center text-blue-700">
          Understanding Dynamic Programming & the LCS Problem
        </h1>

        <p>
          Dynamic programming, like divide and conquer, solves problems by combining solutions
          to subproblems. It applies when subproblems overlap—that is, when they share smaller
          sub-subproblems. A dynamic programming algorithm solves each sub-subproblem only once
          and saves its answer in a table (<strong>memoization</strong>), avoiding redundant recomputation.
        </p>

        <h2 className="text-xl font-semibold text-blue-600">Subsequences</h2>
        <p>
          A subsequence of a sequence is obtained by deleting zero or more elements without changing
          the order of the remaining ones.  
          Example: Z = (B, C, D, B) is a subsequence of X = (A, B, C, B, D, A, B).
        </p>

        <h2 className="text-xl font-semibold text-blue-600">The Longest Common Subsequence (LCS)</h2>
        <p>
          The LCS problem asks for the longest sequence that appears as a subsequence in both X and Y.  
          Given two sequences X = (x₁,…,xₘ) and Y = (y₁,…,yₙ), the goal is to find their maximum-length common subsequence.
        </p>

        <h2 className="text-xl font-semibold text-blue-600">Brute-Force Approach</h2>
        <p>
          A naive method enumerates all subsequences of X (2ⁿ possibilities) and checks which are also
          subsequences of Y. This is exponential in time and impractical for long sequences.
        </p>

        <h2 className="text-xl font-semibold text-blue-600">Recursive Solution & DP Optimization</h2>
        <p>
          The recursive solution explores all possibilities, but dynamic programming stores previously
          computed results (using a DP table or memoization) to avoid recomputation—making it efficient
          with time O(m × n) and space O(m × n).
        </p>

        <div className="flex justify-center mt-8">
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Visualizer
          </button>
        </div>
      </div>
    </div>
  );
}
