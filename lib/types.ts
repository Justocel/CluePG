// Game types
export type Player = {
  id: number
  name: string
  character: string
  position: { x: number; y: number }
  health: number
  maxHealth: number
  inventory: string[]
  color: string
  combatBonuses: {
    attackBonus: number
    defenseBonus: number
    rollBonus: number
    canReroll: boolean
    attackFirst: boolean
  }
  isEliminated: boolean
  boardAbility: { name: string; description: string; uses: number; maxUses: number }
  combatAbility: { name: string; description: string; uses: number; maxUses: number }
  wildShapeRounds: number
}

export type Monster = {
  id: number
  position: { x: number; y: number }
  type: string
  health: number
  maxHealth: number
  defeated: boolean
}

export type GameState = "setup" | "character-select" | "playing" | "combat" | "pvp" | "game-over"

export type CombatState = {
  monster?: Monster
  opponent?: Player
  playerDice: number | null
  opponentDice: number | null
  combatLog: string[]
  isPlayerTurn: boolean
  isRolling: boolean
  hasUsedReroll: boolean
  isPvP: boolean
}

export type Character = {
  name: string
  emoji: string
  color: string
  boardAbility: { name: string; description: string; uses: number; maxUses: number }
  combatAbility: { name: string; description: string; uses: number; maxUses: number }
}

export type TileContent = {
  type: "obstacle" | "player" | "monster" | "heal" | "damage" | "empty"
  content: string
}
