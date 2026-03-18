'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { ReactNode } from 'react';

interface BlockTooltipProps {
    blockNum: number;
    blockType: string;
    blockText: string;
}

export default function BlockTooltip({ blockNum, blockType, blockText }: BlockTooltipProps) {
    return (
        <Tooltip.Provider delayDuration={100}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <button 
                        type="button"
                        className="flex outline-none items-center justify-center w-10 h-10 rounded-lg bg-white border-2 border-gray-200 text-gray-700 font-bold text-sm cursor-help focus:ring-2 focus:ring-purple-400 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-all shadow-sm"
                    >
                        {blockNum}
                    </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        side="top"
                        sideOffset={8}
                        collisionPadding={16}
                        className="z-[100] bg-gray-900 text-white text-xs rounded-xl py-4 px-4 w-72 md:w-80 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                    >
                        <strong className="block text-purple-300 text-[10px] uppercase tracking-[0.2em] mb-2 font-black">
                            {blockType}
                        </strong>
                        <p className="leading-relaxed font-medium text-gray-100 italic">
                            &quot;{blockText}&quot;
                        </p>
                        <Tooltip.Arrow className="fill-gray-900" width={14} height={7} />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
}
