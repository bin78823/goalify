import React, { useEffect, useState } from "react";
import { useTauriWindow } from "../../hooks/useTauriWindow";
import type { Platform } from "../../hooks/useTauriWindow";

const isTauri = () => {
  return typeof window !== "undefined" && "__TAURI__" in window;
};

const getPlatform = async (): Promise<Platform> => {
  if (isTauri()) {
    try {
      const { platform } = await import("@tauri-apps/plugin-os");
      const p = await platform();
      if (p === "macos" || p === "windows" || p === "linux") {
        return p;
      }
      return "unknown";
    } catch {
      return "unknown";
    }
  }
  return "unknown";
};

interface DraggableAreaProps {
  children?: React.ReactNode;
  className?: string;
  showTrafficLights?: boolean;
  trafficLightsPosition?: "left" | "right";
}

const DraggableArea: React.FC<DraggableAreaProps> = ({
  children,
  className = "",
  showTrafficLights = false,
  trafficLightsPosition = "left",
}) => {
  const { startDragging, toggleMaximize } = useTauriWindow();
  const [platform, setPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    getPlatform().then(setPlatform);
  }, []);

  const handleMouseDown = async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, input, [data-no-drag]")) {
      return;
    }
    await startDragging();
  };

  const handleDoubleClick = async () => {
    await toggleMaximize();
  };

  const isMacOS = platform === "macos";
  const isWindows = platform === "windows";

  if (!isTauri()) {
    return <>{children}</>;
  }

  return (
    <div
      className={`flex items-center h-11 bg-transparent select-none ${className}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      data-tauri-drag-region
    >
      {isMacOS && showTrafficLights && trafficLightsPosition === "left" && (
        <div className="w-[80px] h-full" data-tauri-drag-region />
      )}

      {children}

      {isMacOS && showTrafficLights && trafficLightsPosition === "right" && (
        <div className="w-[80px] h-full" data-tauri-drag-region />
      )}

      {isWindows && <div className="flex-1" data-tauri-drag-region />}
    </div>
  );
};

export default DraggableArea;
