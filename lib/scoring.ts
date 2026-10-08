export type RepoSignals = {
  pushedAt: string;
  externalPrMedianResponseHours: number | null;
  hasContributing: boolean;
  issueHasOpenPr: boolean;
};

export type ScoreBreakdown = {
  activity: number;
  responsiveness: number;
  contributing: number;
  noOpenPr: number;
  total: number;
};

const DAY_MS = 86_400_000;

export function activityScore(pushedAt: string, now = Date.now()): number {
  const days = (now - new Date(pushedAt).getTime()) / DAY_MS;
  if (days <= 7) return 30;
  if (days <= 30) return 22;
  if (days <= 90) return 12;
  if (days <= 180) return 5;
  return 0;
}

export function responsivenessScore(medianHours: number | null): number {
  if (medianHours === null) return 8;
  if (medianHours <= 24) return 35;
  if (medianHours <= 72) return 28;
  if (medianHours <= 168) return 18;
  if (medianHours <= 720) return 8;
  return 0;
}

export function scoreRepo(s: RepoSignals, now = Date.now()): ScoreBreakdown {
  const activity = activityScore(s.pushedAt, now);
  const responsiveness = responsivenessScore(s.externalPrMedianResponseHours);
  const contributing = s.hasContributing ? 15 : 0;
  const noOpenPr = s.issueHasOpenPr ? 0 : 20;
  return {
    activity,
    responsiveness,
    contributing,
    noOpenPr,
    total: activity + responsiveness + contributing + noOpenPr,
  };
}
