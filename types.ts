

import React from 'react';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export type ImageAspectRatio = "1:1" | "3:4" | "4:3" | "16:9" | "9:16";
export type VideoAspectRatio = "16:9" | "9:16";

export interface Tab {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Fix: Moved from App.tsx to serve as a single source of truth for this type, resolving a duplicate declaration error.
export interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
}

// Fix: Moved global declaration here to co-locate with the interface and resolve duplicate declaration errors.
declare global {
    interface Window {
        aistudio?: AIStudio;
    }
}