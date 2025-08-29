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
    <div className="flex justify-center items-center h-screen">
      <div 
        className="grid" 
        style={{ 
          gridTemplateColumns: `repeat(${BOARD_SIZE}, min(calc(100vh / ${BOARD_SIZE}), calc(100vw / ${BOARD_SIZE})))`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, min(calc(100vh / ${BOARD_SIZE}), calc(100vw / ${BOARD_SIZE})))`,
          gap: 0,
          width: 'fit-content'
        }}
      >
        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
          const x = index % BOARD_SIZE
          const y = Math.floor(index / BOARD_SIZE)
          const tileContent = getTileContent(x, y)
          const clickable = isTileClickable(x, y)
          
          // Find the player on this tile to get their color
          const playerOnTile = players.find((p) => p.position.x === x && p.position.y === y && !p.isEliminated)
          
          // Check if any player is adjacent to this monster tile
          const isMonsterNearPlayer = tileContent.type === "monster" && players.some((player) => {
            if (player.isEliminated) return false
            const distance = Math.abs(x - player.position.x) + Math.abs(y - player.position.y)
            return distance === 1 // Adjacent (1 tile away)
          })

          return (
            <div
              key={`${x}-${y}`}
              className={`flex items-center justify-center text-2xl cursor-pointer transition-colors border border-gray-300 ${
                tileContent.type === "obstacle"
                  ? "bg-stone-600 text-stone-300"
                  : tileContent.type === "player" && playerOnTile
                  ? `${playerOnTile.color} text-white`
                  : tileContent.type === "monster"
                  ? isMonsterNearPlayer 
                    ? "bg-orange-500 text-white animate-pulse"
                    : "bg-orange-500 text-white"
                  : "bg-background hover:bg-muted"
              } ${clickable ? tileContent.type === "monster" ? "bg-green-500" : "bg-green-200" : ""}`}
              onClick={() => onTileClick(x, y)}
            >
              {tileContent.type === "player" && <span className="text-4xl">{tileContent.content}</span>}
              {tileContent.type === "monster" && <span className="text-2xl">{tileContent.content}</span>}
              {tileContent.type === "obstacle" && <span className="text-xl">{tileContent.content}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
