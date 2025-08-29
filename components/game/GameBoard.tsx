"use client"

import { BOARD_SIZE } from "@/lib/constants"
import { Player, Monster, TileContent } from "@/lib/types"

interface GameBoardProps {
  players: Player[]
  monsters: Monster[]
  obstacles: Set<string>
  onTileClick: (x: number, y: number) => void
  getTileContent: (x: number, y: number) => TileContent
  isTileClickable: (x: number, y: number) => boolean
}

export function GameBoard({
  players,
  monsters,
  obstacles,
  onTileClick,
  getTileContent,
  isTileClickable,
}: GameBoardProps) {
  return (
    <div className="bg-card rounded-lg p-4 overflow-auto">
      <div className="grid gap-px bg-border" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}>
        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
          const x = index % BOARD_SIZE
          const y = Math.floor(index / BOARD_SIZE)
          const tileContent = getTileContent(x, y)
          const clickable = isTileClickable(x, y)

          return (
            <div
              key={`${x}-${y}`}
              className={`w-6 h-6 flex items-center justify-center text-xs cursor-pointer transition-colors ${
                tileContent.type === "obstacle"
                  ? "bg-stone-600 text-stone-300"
                  : "bg-background border border-border hover:bg-muted"
              } ${clickable ? "ring-1 ring-primary/50 hover:ring-primary" : ""}`}
              onClick={() => onTileClick(x, y)}
            >
              {tileContent.type === "player" && <span className="text-lg">{tileContent.content}</span>}
              {tileContent.type === "monster" && <span className="text-lg">{tileContent.content}</span>}
              {tileContent.type === "obstacle" && <span className="text-sm">{tileContent.content}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
