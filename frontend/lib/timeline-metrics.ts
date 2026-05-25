import type { TimelinePoint } from "@/lib/types";

export type SelectedTrend = {
  scoreChange: number;
  balanceChangeRon: number;
};

export type TimelineRange = {
  startIndex: number;
  endIndex: number;
};

export function scoreValue(point: TimelinePoint): number {
  return point.creditScore || point.healthScore;
}

export function trendBetweenPoints(timeline: TimelinePoint[], startIndex: number, endIndex: number): SelectedTrend {
  const firstPoint = timeline[startIndex];
  const selectedPoint = timeline[endIndex];

  if (!firstPoint || !selectedPoint) {
    return { scoreChange: 0, balanceChangeRon: 0 };
  }

  return {
    scoreChange: scoreValue(selectedPoint) - scoreValue(firstPoint),
    balanceChangeRon: selectedPoint.totalBalanceRon - firstPoint.totalBalanceRon,
  };
}

export function inferNextRange({
  index,
  rangeStartIndex,
  selectedIndex,
  lastIndex,
}: {
  index: number;
  rangeStartIndex: number;
  selectedIndex: number;
  lastIndex: number;
}): TimelineRange {
  const isFullRange = rangeStartIndex === 0 && selectedIndex === lastIndex;

  if (isFullRange) {
    const distanceToStart = index;
    const distanceToEnd = lastIndex - index;

    if (distanceToEnd < distanceToStart) {
      return { startIndex: 0, endIndex: index };
    }

    return index === lastIndex ? { startIndex: 0, endIndex: lastIndex } : { startIndex: index, endIndex: lastIndex };
  }

  if (index < rangeStartIndex) {
    return { startIndex: index, endIndex: selectedIndex };
  }

  if (index > selectedIndex) {
    return { startIndex: rangeStartIndex, endIndex: index };
  }

  const distanceToStart = Math.abs(index - rangeStartIndex);
  const distanceToEnd = Math.abs(selectedIndex - index);

  if (distanceToStart <= distanceToEnd) {
    return { startIndex: index, endIndex: selectedIndex };
  }

  return { startIndex: rangeStartIndex, endIndex: index };
}

export function sameTimelineState(left: TimelinePoint, right: TimelinePoint): boolean {
  return (
    scoreValue(left) === scoreValue(right) &&
    left.totalBalanceRon === right.totalBalanceRon &&
    left.totalPastDueRon === right.totalPastDueRon &&
    left.utilizationPercent === right.utilizationPercent &&
    left.activeAccounts === right.activeAccounts &&
    left.inquiryCount === right.inquiryCount &&
    left.negativeSignals === right.negativeSignals
  );
}
