"use client"

import { Button } from "@/components/ui/button"
import { CHARACTERS } from "@/lib/constants"
import { Player } from "@/lib/types"

interface PlayerInfoProps {
  player: Player
  index: number
  currentPlayer: number
  gameState: string
  onPlayerSelect: (player: Player) => void
  onActivateBoardAbility: (abilityName: string) => void
}

export function PlayerInfo({
  player,
  index,
  currentPlayer,
  gameState,
  onPlayerSelect,
  onActivateBoardAbility,
}: PlayerInfoProps) {
  const character = CHARACTERS.find((c) => c.name === player.character)

  return (
    <div className="space-y-2">
      <div
        className={`p-3 rounded-lg cursor-pointer transition-colors ${
          index === currentPlayer ? "ring-2 ring-primary" : ""
        } ${player.color} text-white`}
        onClick={() => onPlayerSelect(player)}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium">
            {character?.emoji} {player.name}
          </span>
          <span className="text-sm">
            {player.health}/{player.maxHealth} HP
          </span>
        </div>
        <div className="text-xs mt-1 opacity-90">
          {player.character} {player.isEliminated ? "(Eliminated)" : ""}
        </div>
      </div>

      {index === currentPlayer && gameState === "playing" && (
        <div className="space-y-1">
          <Button
            size="sm"
            variant="outline"
            disabled={player.boardAbility.uses <= 0}
            onClick={() => onActivateBoardAbility(player.boardAbility.name)}
            className="w-full text-xs"
          >
            {player.boardAbility.name} ({player.boardAbility.uses}/{player.boardAbility.maxUses})
          </Button>
        </div>
      )}
    </div>
  )
}
