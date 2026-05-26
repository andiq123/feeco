"use client";

import { AccountsTable } from "@/components/accounts-table";
import { InquiriesPanel } from "@/components/inquiries-panel";
import { MobileTimelineControls } from "@/components/mobile-timeline-controls";
import { ReportHeader } from "@/components/report-header";
import { ReportSummaryWidgets } from "@/components/report-summary-widgets";
import { ResultToolbar } from "@/components/result-shell";
import { useReportTransition } from "@/hooks/use-report-transition";
import { formatReportMonth } from "@/lib/formatters";
import { copy, type Language } from "@/lib/i18n";
import { sameTimelineState, scoreValue, trendBetweenPoints } from "@/lib/timeline-metrics";
import type { BatchCreditReport, TimelinePoint } from "@/lib/types";
import type { KeyboardEvent, MouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type BatchReportViewProps = {
  batchReport: BatchCreditReport;
  fileName: string;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onReturn: () => void;
};

type TimelineHandle = "start" | "end";
type TimelineInteraction = "idle" | "pending-click" | "long-press" | "dragging";

export function BatchReportView({ batchReport, fileName, language, onLanguageChange, onReturn }: BatchReportViewProps) {
  const [rangeStartIndex, setRangeStartIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(batchReport.reports.length - 1);
  const { displayIndex, isSettled } = useReportTransition(selectedIndex);
  const selectedReport = batchReport.reports[displayIndex];
  const selectedPoint = batchReport.timeline[displayIndex];
  const selectedTrend = trendBetweenPoints(batchReport.timeline, rangeStartIndex, displayIndex);
  const rangeStartPoint = batchReport.timeline[rangeStartIndex] ?? batchReport.timeline[0];
  const rangeReportCount = Math.max(displayIndex - rangeStartIndex + 1, 1);
  const transitionClass = isSettled ? "report-transition" : "report-transition report-transition--leaving";

  if (!selectedReport || !selectedPoint) {
    return null;
  }

  return (
    <main className="mobile-contained mx-auto w-full max-w-[1500px] space-y-2.5 px-2.5 pb-24 pt-2.5 text-[var(--ink)] sm:space-y-6 sm:px-7 sm:py-6 lg:px-10">
      <ResultToolbar language={language} onLanguageChange={onLanguageChange} onReturn={onReturn} />
      <ReportHeader
        report={selectedReport}
        fileName={selectedReport.fileName || fileName}
        language={language}
        eyebrow={copy[language].batch.reportCount(displayIndex + 1)}
        date={selectedPoint.reportDate || selectedPoint.label}
        scoreChange={selectedTrend.scoreChange}
        selectedCountText={copy[language].batch.totalSelected(rangeReportCount)}
        dateRangeText={copy[language].batch.dateRange(rangeStartPoint?.reportDate || batchReport.summary.firstReportDate, selectedReport.reportDate || batchReport.summary.lastReportDate)}
        transitionClass={transitionClass}
        sideContent={<HeaderScoreProgression timeline={batchReport.timeline} language={language} rangeStartIndex={rangeStartIndex} selectedIndex={selectedIndex} onRangeStartChange={setRangeStartIndex} onSelect={setSelectedIndex} />}
      />
      <div className="grid min-w-0 gap-2.5">
        <section className="min-w-0 space-y-2.5 sm:space-y-5">
          <div className={transitionClass}>
            <div className="stagger-1">
              <ReportSummaryWidgets report={selectedReport} language={language} balanceLabel={copy[language].batch.balanceChange} balanceValue={selectedTrend.balanceChangeRon} signedBalance />
            </div>
          </div>
          <div className={transitionClass}>
            <InquiriesPanel inquiries={selectedReport.inquiries} language={language} />
          </div>
          <div className={`stagger-2 ${transitionClass}`}>
            <AccountsTable accounts={selectedReport.accounts} language={language} limit={6} />
          </div>
        </section>
      </div>
      <MobileTimelineControls language={language}>
        <HeaderScoreProgression timeline={batchReport.timeline} language={language} rangeStartIndex={rangeStartIndex} selectedIndex={selectedIndex} onRangeStartChange={setRangeStartIndex} onSelect={setSelectedIndex} />
      </MobileTimelineControls>
    </main>
  );
}

function HeaderScoreProgression({
  timeline,
  language,
  rangeStartIndex,
  selectedIndex,
  onRangeStartChange,
  onSelect,
}: {
  timeline: TimelinePoint[];
  language: Language;
  rangeStartIndex: number;
  selectedIndex: number;
  onRangeStartChange: (index: number) => void;
  onSelect: (index: number) => void;
}) {
  const labels = copy[language].batch;
  const progression = useMemo(() => compactTimeline(timeline), [timeline]);
  const timelineScores = useMemo(() => timeline.map(scoreValue).filter(isPositiveScore), [timeline]);
  const selectedTimeline = useMemo(() => timeline.slice(rangeStartIndex, selectedIndex + 1), [rangeStartIndex, selectedIndex, timeline]);
  const selectedScores = useMemo(() => selectedTimeline.map(scoreValue).filter(isPositiveScore), [selectedTimeline]);
  const scores = selectedScores.length > 0 ? selectedScores : timelineScores;
  const hiddenCount = timeline.length - progression.length;

  if (scores.length === 0) {
    return null;
  }

  const selectedMinScore = Math.min(...scores);
  const selectedMaxScore = Math.max(...scores);
  const graphScores = timelineScores;
  const graphMinScore = Math.min(...graphScores);
  const graphMaxScore = Math.max(...graphScores);
  const selectedFirstPoint = selectedTimeline[0] ?? timeline[0];
  const selectedLastPoint = selectedTimeline[selectedTimeline.length - 1] ?? timeline[timeline.length - 1];
  const firstScore = scoreValue(selectedFirstPoint);
  const latestScore = scoreValue(selectedLastPoint);
  const totalDelta = latestScore - firstScore;
  const isFullRange = rangeStartIndex === 0 && selectedIndex === timeline.length - 1;
  const resetRange = () => {
    onRangeStartChange(0);
    onSelect(timeline.length - 1);
  };
  const handleStartMove = (index: number) => {
    onRangeStartChange(Math.min(index, selectedIndex));
  };
  const handleEndMove = (index: number) => {
    onSelect(Math.max(index, rangeStartIndex));
  };

  return (
    <div className="smooth-layout flex min-h-[19.75rem] w-full flex-col rounded-[1.75rem] bg-white/18 p-5 backdrop-blur-xl">
      <div className="grid min-h-[5.8rem] grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--blue)]">{labels.scoreProgression}</p>
          <p className="mt-1 truncate text-sm font-bold text-[var(--muted)]">{formatReportMonth(selectedFirstPoint?.reportDate || selectedFirstPoint?.label || "", language)} - {formatReportMonth(selectedLastPoint?.reportDate || selectedLastPoint?.label || "", language)}</p>
          {hiddenCount > 0 && <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[var(--olive)]">{labels.statusCurrent(hiddenCount)}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="numeric font-[var(--font-display)] text-4xl font-semibold leading-none">{selectedMinScore}-{selectedMaxScore}</p>
          <p className={`mt-1 text-xs font-bold ${totalDelta >= 0 ? "text-[var(--olive)]" : "text-[var(--clay)]"}`}>{totalDelta > 0 ? "+" : ""}{totalDelta}</p>
        </div>
      </div>
      <div className="mt-1 grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <span className="min-w-0 truncate rounded-full bg-white/55 px-3 py-1.5 text-xs font-bold text-[var(--muted)] ring-1 ring-white/70">{labels.rangeHelp}</span>
        <button
          className={`rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-[var(--blue)] ring-1 ring-white/80 transition-all duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] ${isFullRange ? "pointer-events-none opacity-0" : "opacity-100"}`}
          type="button"
          onClick={resetRange}
          tabIndex={isFullRange ? -1 : 0}
          aria-hidden={isFullRange}
        >
          {labels.resetRange}
        </button>
      </div>
      <div className="smooth-layout min-h-[10.75rem] flex-1">
        <ProgressionLine timeline={progression} language={language} maxScore={graphMaxScore} minScore={graphMinScore} rangeStartIndex={rangeStartIndex} selectedIndex={selectedIndex} onStartMove={handleStartMove} onEndMove={handleEndMove} compact />
      </div>
    </div>
  );
}

function ProgressionLine({
  timeline,
  language,
  maxScore,
  minScore,
  rangeStartIndex,
  selectedIndex,
  onStartMove,
  onEndMove,
  compact = false,
}: {
  timeline: ProgressionPoint[];
  language: Language;
  maxScore: number;
  minScore: number;
  rangeStartIndex: number;
  selectedIndex: number;
  onStartMove: (index: number) => void;
  onEndMove: (index: number) => void;
  compact?: boolean;
}) {
  const edgePadding = compact ? 92 : 64;
  const viewportGutter = compact ? 72 : 32;
  const width = Math.max(compact ? 820 : 560, timeline.length * (compact ? 118 : 84));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<TimelineHandle | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactionRef = useRef<TimelineInteraction>("idle");
  const [dragPreview, setDragPreview] = useState<{ handle: TimelineHandle; x: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollHint, setScrollHint] = useState({ left: false, right: false });
  const height = compact ? 172 : 190;
  const chartTop = compact ? 48 : 18;
  const chartHeight = compact ? 54 : 92;
  const range = Math.max(maxScore - minScore, 1);
  const points = useMemo(() => timeline.map((point, index) => {
    const x = edgePadding + (index / Math.max(timeline.length - 1, 1)) * (width - edgePadding * 2);
    const y = chartTop + (1 - (scoreValue(point.point) - minScore) / range) * chartHeight;
    const period = formatReportMonth(point.point.reportDate || point.point.label, language);
    const previousPeriod = index > 0 ? formatReportMonth(timeline[index - 1].point.reportDate || timeline[index - 1].point.label, language) : "";
    const score = scoreValue(point.point);
    const previousScore = point.previousPoint ? scoreValue(point.previousPoint) : score;
    const delta = score - previousScore;

    return { ...point, x, y, score, delta, period, showPeriod: index === 0 || period !== previousPeriod };
  }), [chartHeight, chartTop, edgePadding, language, minScore, range, timeline, width]);
  const path = useMemo(() => points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" "), [points]);
  const rangeStartPoint = points.find((point) => point.index === rangeStartIndex || point.hiddenIndexes.includes(rangeStartIndex)) ?? points[0];
  const rangeEndPoint = points.find((point) => point.index === selectedIndex || point.hiddenIndexes.includes(selectedIndex)) ?? points[points.length - 1];
  const isFullRange = rangeStartPoint === points[0] && rangeEndPoint === points[points.length - 1];
  const previewStartX = dragPreview?.handle === "start" ? dragPreview.x : rangeStartPoint?.x;
  const previewEndX = dragPreview?.handle === "end" ? dragPreview.x : rangeEndPoint?.x;
  const rangeLeft = Math.min(previewStartX ?? 0, previewEndX ?? 0);
  const rangeRight = Math.max(previewStartX ?? 0, previewEndX ?? 0);
  const rangeTrackY = chartTop + chartHeight + 28;
  const selectDraggedPoint = (clientX: number) => {
    const scrollNode = scrollRef.current;
    const draggingHandle = dragRef.current;

    if (!scrollNode || !draggingHandle) {
      return;
    }

    const rect = scrollNode.getBoundingClientRect();
    const rawX = clientX - rect.left + scrollNode.scrollLeft - viewportGutter;
    const minX = draggingHandle === "start" ? points[0]?.x : rangeStartPoint?.x;
    const maxX = draggingHandle === "start" ? rangeEndPoint?.x : points[points.length - 1]?.x;
    const x = clamp(rawX, minX ?? rawX, maxX ?? rawX);
    setDragPreview({ handle: draggingHandle, x });

    const nearestPoint = nearestTimelinePoint(points, x);

    if (!nearestPoint) {
      return;
    }

    if (draggingHandle === "start") {
      onStartMove(nearestPoint.index);
      return;
    }

    onEndMove(nearestPoint.index);
  };
  const startHandleDrag = (handle: TimelineHandle, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    cancelPointTimers();
    dragRef.current = handle;
    interactionRef.current = "dragging";
    setIsDragging(true);
    selectDraggedPoint(event.clientX);
  };
  const moveHandleDrag = (clientX: number) => {
    if (!dragRef.current) {
      return;
    }

    if (dragFrameRef.current) {
      cancelAnimationFrame(dragFrameRef.current);
    }

    dragFrameRef.current = requestAnimationFrame(() => {
      selectDraggedPoint(clientX);
    });
  };
  const stopHandleDrag = () => {
    dragRef.current = null;
    setDragPreview(null);
    setIsDragging(false);
    window.setTimeout(() => {
      if (interactionRef.current === "dragging") {
        interactionRef.current = "idle";
      }
    }, 0);
  };
  const handlePointClick = (index: number, event: MouseEvent<HTMLButtonElement>) => {
    if (interactionRef.current === "long-press" || interactionRef.current === "dragging") {
      interactionRef.current = "idle";
      return;
    }

    cancelPointTimers();

    if (event.detail >= 2) {
      setStartPoint(index);
      return;
    }

    interactionRef.current = "pending-click";
    clickTimeoutRef.current = setTimeout(() => {
      if (interactionRef.current === "pending-click") {
        onEndMove(index);
        interactionRef.current = "idle";
      }
    }, 280);
  };
  const setStartPoint = (index: number) => {
    cancelPointTimers();
    interactionRef.current = "long-press";
    onStartMove(index);
    window.setTimeout(() => {
      if (interactionRef.current === "long-press") {
        interactionRef.current = "idle";
      }
    }, 260);
  };
  const startLongPress = (index: number, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse") {
      return;
    }

    clearLongPress();
    longPressTimeoutRef.current = setTimeout(() => {
      setStartPoint(index);
    }, 430);
  };
  const cancelPointTimers = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    clearLongPress();
  };
  const clearLongPress = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };
  const selectAdjacentPoint = (event: KeyboardEvent<HTMLButtonElement>, pointIndex: number) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextPoint = points[Math.min(Math.max(pointIndex + direction, 0), points.length - 1)];

    if (nextPoint) {
      onEndMove(nextPoint.index);
    }
  };

  useEffect(() => {
    const scrollNode = scrollRef.current;

    if (!scrollNode) {
      return;
    }

    if (isDragging) {
      return;
    }

    const selectedPoint = points.find((point) => point.index === selectedIndex || point.hiddenIndexes.includes(selectedIndex)) ?? points[points.length - 1];
    const targetLeft = selectedPoint ? Math.max(selectedPoint.x + viewportGutter - scrollNode.clientWidth / 2, 0) : scrollNode.scrollWidth;

    scrollNode.scrollTo({
      left: selectedPoint?.index === points[points.length - 1]?.index ? scrollNode.scrollWidth : targetLeft,
      behavior: "smooth",
    });
  }, [isDragging, maxScore, minScore, selectedIndex, timeline.length, width]);

  useEffect(() => {
    return () => {
      if (dragFrameRef.current) {
        cancelAnimationFrame(dragFrameRef.current);
      }
      cancelPointTimers();
    };
  }, []);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      moveHandleDrag(event.clientX);
    };
    const handlePointerEnd = () => {
      stopHandleDrag();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [isDragging, points, rangeEndPoint?.x, rangeStartPoint?.x]);

  useEffect(() => {
    const scrollNode = scrollRef.current;

    if (!scrollNode) {
      return;
    }

    const updateScrollHint = () => {
      const maxScrollLeft = scrollNode.scrollWidth - scrollNode.clientWidth;
      setScrollHint({
        left: scrollNode.scrollLeft > 8,
        right: scrollNode.scrollLeft < maxScrollLeft - 8,
      });
    };

    updateScrollHint();
    scrollNode.addEventListener("scroll", updateScrollHint, { passive: true });
    window.addEventListener("resize", updateScrollHint);

    return () => {
      scrollNode.removeEventListener("scroll", updateScrollHint);
      window.removeEventListener("resize", updateScrollHint);
    };
  }, [timeline.length, width]);

  return (
    <div className="relative">
      {scrollHint.left && <ScrollHint direction="left" label={copy[language].batch.scrollLeft} />}
      {scrollHint.right && <ScrollHint direction="right" label={copy[language].batch.scrollRight} />}
      <div className={`mobile-scroll-row ${compact ? "mt-2 pb-4" : "mt-4 pb-2"}`} ref={scrollRef} aria-label={copy[language].batch.scoreProgression} style={{ paddingInline: viewportGutter }}>
      <div className={`relative ${compact ? "min-h-[10.75rem]" : "min-h-[13rem]"}`} style={{ width }}>
        <svg className={`pointer-events-none absolute inset-x-0 top-0 ${isDragging ? "timeline-graph--dragging" : ""}`} style={{ height, width }} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={copy[language].batch.scoreProgression}>
          <defs>
            <linearGradient id="ficoProgressionLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--olive)" />
              <stop offset="100%" stopColor="var(--blue)" />
            </linearGradient>
          </defs>
          <path d={`M 44 ${chartTop + chartHeight} H ${width - 44}`} stroke="rgba(80,98,124,0.18)" strokeWidth="1" />
          <g className={`timeline-range-group ${isFullRange ? "timeline-range-group--hidden" : ""}`}>
            <path className="timeline-range-line" d={`M ${rangeLeft} ${rangeTrackY} H ${rangeRight}`} stroke="rgba(50,120,255,0.14)" strokeLinecap="round" strokeWidth="10" />
            <path className="timeline-range-line" d={`M ${rangeLeft} ${rangeTrackY} H ${rangeRight}`} stroke="var(--blue)" strokeLinecap="round" strokeWidth="3" />
          </g>
          <path className="timeline-score-line" d={path} fill="none" stroke="rgba(50,120,255,0.14)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={compact ? "9" : "12"} />
          <path className="timeline-score-line" d={path} fill="none" stroke="url(#ficoProgressionLine)" strokeLinecap="round" strokeLinejoin="round" strokeWidth={compact ? "3" : "4"} />
          {points.map((point) => {
            const selected = point.index === selectedIndex || point.hiddenIndexes.includes(selectedIndex);
            const rangeStart = point.index === rangeStartIndex || point.hiddenIndexes.includes(rangeStartIndex);
            const endpoint = selected || (rangeStart && !isFullRange);
            return (
              <g key={`${point.point.fileName}-${point.index}-node`}>
                {!compact && <line x1={point.x} x2={point.x} y1={point.y + 12} y2={chartTop + chartHeight + 18} stroke="rgba(80,98,124,0.16)" strokeDasharray="3 5" />}
                {compact && (
                  <>
                    <text x={point.x} y={Math.max(17, point.y - 36)} textAnchor="middle" fill={selected ? "var(--ink)" : "var(--muted)"} fontSize={selected ? "14" : "12"} fontWeight="800">
                      {point.score}
                    </text>
                    <text x={point.x} y={Math.max(33, point.y - 20)} textAnchor="middle" fill={point.delta >= 0 ? "var(--olive)" : "var(--clay)"} fontSize="10" fontWeight="800">
                      {point.delta === 0 ? "0" : `${point.delta > 0 ? "+" : ""}${point.delta}`}
                    </text>
                  </>
                )}
                <circle className="timeline-node" cx={point.x} cy={point.y} r={endpoint ? (compact ? 9 : 9) : compact ? 5.5 : 6} fill={selected ? "var(--blue)" : rangeStart && !isFullRange ? "var(--olive)" : "white"} stroke={endpoint ? "white" : "var(--blue)"} strokeWidth={compact ? "3.2" : "3"} />
                {endpoint && <circle className="timeline-node-ring" cx={point.x} cy={point.y} r={14} fill="none" stroke={rangeStart ? "rgba(34,160,107,0.3)" : "rgba(50,120,255,0.3)"} strokeWidth="4" />}
                {compact && endpoint && (
                  <text className={`timeline-endpoint-label ${isFullRange ? "timeline-endpoint-label--hidden" : ""}`} x={point.x} y={rangeTrackY + 13} textAnchor="middle" fill={rangeStart ? "var(--olive)" : "var(--blue)"} fontSize="10" fontWeight="900">
                    {rangeStart ? copy[language].batch.start : copy[language].batch.end}
                  </text>
                )}
                {compact && point.showPeriod && (
                  <text x={point.x} y={rangeTrackY + 39} textAnchor="middle" fill="var(--muted)" fontSize="12" fontWeight="700">
                    {point.period}
                  </text>
                )}
              </g>
            );
          })}
          {dragPreview && (
            <circle className="timeline-drag-preview" cx={dragPreview.x} cy={rangeTrackY} r="8" fill={dragPreview.handle === "start" ? "var(--olive)" : "var(--blue)"} stroke="white" strokeWidth="3" />
          )}
        </svg>
        {points.map((point, pointIndex) =>
          compact ? (() => {
            const selected = point.index === selectedIndex || point.hiddenIndexes.includes(selectedIndex);
            const rangeStart = point.index === rangeStartIndex || point.hiddenIndexes.includes(rangeStartIndex);
            const dragHandle = !isFullRange && rangeStart ? "start" : !isFullRange && selected ? "end" : null;

            return (
              <button
                className={`timeline-point-hit absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full ${dragHandle ? "timeline-point-hit--draggable" : ""}`}
                style={{ left: point.x, top: point.y }}
                type="button"
                onClick={(event) => handlePointClick(point.index, event)}
                onPointerDown={dragHandle ? (event) => startHandleDrag(dragHandle, event) : undefined}
                onPointerDownCapture={!dragHandle ? (event) => startLongPress(point.index, event) : undefined}
                onPointerMoveCapture={!dragHandle ? clearLongPress : undefined}
                onPointerUpCapture={!dragHandle ? clearLongPress : undefined}
                onPointerCancelCapture={!dragHandle ? clearLongPress : undefined}
                onPointerLeave={!dragHandle ? clearLongPress : undefined}
                onKeyDown={(event) => selectAdjacentPoint(event, pointIndex)}
                aria-current={selected ? "true" : undefined}
                aria-label={`${copy[language].batch.chooseEnd}: ${formatReportMonth(point.point.reportDate || point.point.label, language)} FICO ${point.score}, ${point.delta === 0 ? "0" : `${point.delta > 0 ? "+" : ""}${point.delta}`}. ${copy[language].batch.rangeHelp}`}
                key={`${point.point.fileName}-${point.index}-compact-button`}
              />
            );
          })() : (
            <ProgressionPointButton point={point.point} index={point.index} x={point.x} language={language} selected={point.index === selectedIndex || point.hiddenIndexes.includes(selectedIndex)} previousPoint={point.previousPoint} onClick={() => onEndMove(point.index)} key={`${point.point.fileName}-${point.index}-button`} />
          ),
        )}
      </div>
    </div>
    </div>
  );
}

function ScrollHint({ direction, label }: { direction: "left" | "right"; label: string }) {
  return (
    <div className={`pointer-events-none absolute top-[5.8rem] z-10 hidden h-8 w-8 place-items-center rounded-full bg-white/75 text-sm font-black text-[var(--blue)] shadow-sm ring-1 ring-white/80 backdrop-blur sm:grid ${direction === "left" ? "left-1" : "right-1"}`} aria-label={label}>
      <span aria-hidden="true">{direction === "left" ? "‹" : "›"}</span>
    </div>
  );
}

function ProgressionPointButton({
  point,
  index,
  x,
  language,
  selected,
  previousPoint,
  onClick,
}: {
  point: TimelinePoint;
  index: number;
  x: number;
  language: Language;
  selected: boolean;
  previousPoint: TimelinePoint | undefined;
  onClick: () => void;
}) {
  const score = scoreValue(point);
  const previousScore = previousPoint ? scoreValue(previousPoint) : score;
  const delta = score - previousScore;
  const isPositive = delta >= 0;

  return (
    <button
      className={`absolute top-[7.55rem] w-24 -translate-x-1/2 rounded-2xl border px-2 py-2 text-center transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] ${
        selected ? "border-[rgba(50,120,255,0.5)] bg-white shadow-lg shadow-blue-500/10" : "border-transparent bg-white/55"
      }`}
      style={{ left: x }}
      type="button"
      onClick={onClick}
    >
      <p className="truncate text-[0.68rem] font-bold text-[var(--ink)]">{formatReportMonth(point.reportDate || point.label, language)}</p>
      <p className="numeric mt-1 font-[var(--font-display)] text-xl font-semibold leading-none">{score}</p>
      <p className={`mt-1 text-xs font-bold ${isPositive ? "text-[var(--olive)]" : "text-[var(--clay)]"}`}>
        {index === 0 || delta === 0 ? "0" : `${isPositive ? "+" : ""}${delta}`}
      </p>
    </button>
  );
}

type ProgressionPoint = {
  point: TimelinePoint;
  index: number;
  previousPoint: TimelinePoint | undefined;
  hiddenIndexes: number[];
};

function compactTimeline(timeline: TimelinePoint[]): ProgressionPoint[] {
  return timeline.reduce<ProgressionPoint[]>((points, point, index) => {
    const previous = points[points.length - 1];

    if (previous && sameTimelineState(previous.point, point)) {
      addHiddenIndex(previous, previous.index);
      previous.point = point;
      previous.index = index;
      addHiddenIndex(previous, index);
      return points;
    }

    points.push({
      point,
      index,
      previousPoint: index > 0 ? timeline[index - 1] : undefined,
      hiddenIndexes: [],
    });
    return points;
  }, []);
}

function addHiddenIndex(point: ProgressionPoint, index: number) {
  if (!point.hiddenIndexes.includes(index)) {
    point.hiddenIndexes.push(index);
  }
}

function nearestTimelinePoint(points: Array<ProgressionPoint & { x: number }>, x: number) {
  return points.reduce<(ProgressionPoint & { x: number }) | null>((nearestPoint, point) => {
    if (!nearestPoint) {
      return point;
    }

    return Math.abs(point.x - x) < Math.abs(nearestPoint.x - x) ? point : nearestPoint;
  }, null);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isPositiveScore(score: number): boolean {
  return score > 0;
}
