import { useEffect, useRef, useState } from "react";

export function useReportTransition(selectedIndex: number) {
  const [displayIndex, setDisplayIndex] = useState(selectedIndex);
  const [isSettled, setIsSettled] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selectedIndex === displayIndex) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSettled(false);
    timeoutRef.current = setTimeout(() => {
      setDisplayIndex(selectedIndex);
      requestAnimationFrame(() => setIsSettled(true));
    }, 120);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [displayIndex, selectedIndex]);

  return { displayIndex, isSettled };
}
