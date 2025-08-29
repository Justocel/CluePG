import { BOARD_SIZE, MONSTERS, CHARACTERS } from "./constants"
import { Player, Monster, TileContent } from "./types"

export const generateObstacles = () => {
  const obstacles = new Set<string>()

  // Add border obstacles
  for (let i = 0; i < BOARD_SIZE; i++) {
    obstacles.add(`0,${i}`) // Left border
    obstacles.add(`${BOARD_SIZE - 1},${i}`) // Right border
    obstacles.add(`${i},0`) // Top border
    obstacles.add(`${i},${BOARD_SIZE - 1}`) // Bottom border
  }

  // Add some random internal obstacles
  const internalObstacles = 15
  for (let i = 0; i < internalObstacles; i++) {
    let x, y
    do {
      x = Math.floor(Math.random() * (BOARD_SIZE - 4)) + 2
      y = Math.floor(Math.random() * (BOARD_SIZE - 4)) + 2
    } while (obstacles.has(`${x},${y}`))
    obstacles.add(`${x},${y}`)
  }

  return obstacles
}

export const getTileContent = (
  x: number,
  y: number,
  players: Player[],
  monsters: Monster[],
  obstacles: Set<string>
): TileContent => {
  if (obstacles.has(`${x},${y}`)) {
    return { type: "obstacle", content: "🗿" }
  }

  const player = players.find((p) => p.position.x === x && p.position.y === y && !p.isEliminated)
  const monster = monsters.find((m) => m.position.x === x && m.position.y === y && !m.defeated)

  if (player) {
    const character = CHARACTERS.find((c) => c.name === player.character)
    return { type: "player", content: character?.emoji || "👤" }
  }
  if (monster) return { type: "monster", content: monster.type }
  return { type: "empty", content: "" }
}

export const calculateItemBonuses = (inventory: string[]) => {
  const bonuses = {
    attackBonus: 0,
    defenseBonus: 0,
    rollBonus: 0,
    canReroll: false,
    attackFirst: false,
  }

  inventory.forEach((item) => {
    if (item.includes("Magic Sword") || item.includes("Enchanted Bow")) {
      bonuses.attackBonus += 2
    } else if (item.includes("Shield of Protection")) {
      bonuses.defenseBonus += 2
    } else if (item.includes("Crystal of Power")) {
      bonuses.rollBonus += 1
    } else if (item.includes("Strength Elixir")) {
      bonuses.attackBonus += 3
    } else if (item.includes("Lucky Charm")) {
      bonuses.canReroll = true
    } else if (item.includes("Blade of Swiftness")) {
      bonuses.attackFirst = true
    }
  })

  return bonuses
}

export const isTileClickable = (
  x: number,
  y: number,
  gameState: string,
  movesLeft: number,
  currentPlayer: Player,
  players: Player[],
  obstacles: Set<string>,
  monsters: Monster[],
  isTeleportActive: boolean = false
) => {
  if (gameState !== "playing") return false

  if (!currentPlayer || currentPlayer.isEliminated) return false

  // Allow teleport even when movesLeft is 0
  if (isTeleportActive) {
    if(obstacles.has(`${x},${y}`)) return false;

    const occupiedByPlayer = players.find((player) => player.position.x === x && player.position.y === y && !player.isEliminated);
    if(occupiedByPlayer) return false;

    const occupiedByMonster = monsters.find((monster) => monster.position.x === x && monster.position.y === y && !monster.defeated);
    if(occupiedByMonster) return false;

    return true; 
  }

  // For normal movement, require movesLeft > 0
  if (movesLeft <= 0) return false
  
  const distance = Math.abs(x - currentPlayer.position.x) + Math.abs(y - currentPlayer.position.y)
  if (distance !== 1) return false

  // Check for obstacles (unless player has Nature's Path ability)
  if (obstacles.has(`${x},${y}`) && currentPlayer.boardAbility.name !== "Nature's Path") {
    return false
  }

  // Check for other players (unless player has Stealth ability)
  const otherPlayer = players.find(
    (p) => p.position.x === x && p.position.y === y && p.id !== currentPlayer.id && !p.isEliminated,
  )
  if (otherPlayer && currentPlayer.boardAbility.name !== "Stealth") {
    return false
  }

  return true
}
