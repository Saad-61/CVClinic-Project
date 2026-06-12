export interface DiffChange {
  value: string;
  added?: boolean;
  removed?: boolean;
}

/**
 * Computes word-level differences between two strings using the LCS algorithm.
 */
export function diffWords(one: string, two: string): DiffChange[] {
  // Edge case: check empty strings
  if (!one && !two) return [];
  if (!one) return [{ value: two, added: true }];
  if (!two) return [{ value: one, removed: true }];

  // Split strings into words and spaces to preserve exact layout
  const words1 = one.split(/(\s+)/).filter(Boolean);
  const words2 = two.split(/(\s+)/).filter(Boolean);

  const n = words1.length;
  const m = words2.length;
  
  // DP table for Longest Common Subsequence (LCS)
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (words1[i - 1] === words2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff changes
  const changes: DiffChange[] = [];
  let i = n, j = m;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && words1[i - 1] === words2[j - 1]) {
      changes.unshift({ value: words1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      changes.unshift({ value: words2[j - 1], added: true });
      j--;
    } else {
      changes.unshift({ value: words1[i - 1], removed: true });
      i--;
    }
  }
  
  // Merge consecutive changes of the same type for cleaner rendering
  const merged: DiffChange[] = [];
  for (const c of changes) {
    const last = merged[merged.length - 1];
    if (last && last.added === c.added && last.removed === c.removed) {
      last.value += c.value;
    } else {
      merged.push({ ...c });
    }
  }
  
  return merged;
}
