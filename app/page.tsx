"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

// Game types
type Player = {
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

type Monster = {
  id: number
  position: { x: number; y: number }
  type: string
  health: number
  maxHealth: number
  defeated: boolean
}

type GameState = "setup" | "character-select" | "playing" | "combat" | "pvp" | "game-over"

type CombatState = {
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

const CHARACTERS = [
  {
    name: "Warrior",
    emoji: "⚔️",
    color: "bg-red-500",
    boardAbility: { name: "Charge", description: "Move 2 extra tiles once per turn", uses: 1, maxUses: 1 },
    combatAbility: { name: "Berserker Rage", description: "Deal +4 damage for one attack", uses: 2, maxUses: 2 },
  },
  {
    name: "Mage",
    emoji: "🧙‍♂️",
    color: "bg-blue-500",
    boardAbility: { name: "Teleport", description: "Move to any empty tile", uses: 1, maxUses: 1 },
    combatAbility: { name: "Magic Missile", description: "Guaranteed 8 damage (no dice)", uses: 1, maxUses: 1 },
  },
  {
    name: "Archer",
    emoji: "🏹",
    color: "bg-green-500",
    boardAbility: { name: "Eagle Eye", description: "See all monster positions", uses: 3, maxUses: 3 },
    combatAbility: { name: "Precise Shot", description: "Always roll maximum on dice", uses: 1, maxUses: 1 },
  },
  {
    name: "Rogue",
    emoji: "🗡️",
    color: "bg-purple-500",
    boardAbility: { name: "Stealth", description: "Move through other players", uses: 2, maxUses: 2 },
    combatAbility: { name: "Backstab", description: "Attack first and deal +3 damage", uses: 2, maxUses: 2 },
  },
  {
    name: "Paladin",
    emoji: "🛡️",
    color: "bg-yellow-500",
    boardAbility: { name: "Divine Protection", description: "Heal 20 HP", uses: 2, maxUses: 2 },
    combatAbility: { name: "Holy Strike", description: "Deal damage equal to missing health", uses: 1, maxUses: 1 },
  },
  {
    name: "Druid",
    emoji: "🌿",
    color: "bg-emerald-500",
    boardAbility: { name: "Nature's Path", description: "Move through obstacles", uses: 3, maxUses: 3 },
    combatAbility: { name: "Wild Shape", description: "Take half damage for 3 rounds", uses: 1, maxUses: 1 },
  },
]

const MONSTERS = ["🐉", "👹", "🧟", "🕷️", "🐺", "🦇", "👻", "🐍"]

const MAGICAL_ITEMS = [
  "⚔️ Magic Sword (+2 attack)",
  "🛡️ Shield of Protection (+2 defense)",
  "💎 Health Potion (restore 30 HP)",
  "🔮 Crystal of Power (+1 to all rolls)",
  "🏹 Enchanted Bow (+2 attack)",
  "🧪 Strength Elixir (+3 attack for one combat)",
  "🌟 Lucky Charm (reroll once per combat)",
  "🗡️ Blade of Swiftness (attack first in combat)",
]

const BOARD_SIZE = 18

const generateObstacles = () => {
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

export default function BoardGame() {
  const [gameState, setGameState] = useState<GameState>("setup")
  const [playerCount, setPlayerCount] = useState(2)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayerSetup, setCurrentPlayerSetup] = useState(0)
  const [monsters, setMonsters] = useState<Monster[]>([])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [diceValue, setDiceValue] = useState<number | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [movesLeft, setMovesLeft] = useState(0)
  const [gameMessage, setGameMessage] = useState("")

  const [combatState, setCombatState] = useState<CombatState | null>(null)
  const [showInventory, setShowInventory] = useState(false)
  const [inventoryPlayerId, setInventoryPlayerId] = useState<number | null>(null)
  const [pvpTarget, setPvpTarget] = useState<number | null>(null)
  const [winner, setWinner] = useState<Player | null>(null)
  const [obstacles, setObstacles] = useState<Set<string>>(new Set())
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  const InventoryDialog = ({ player }: { player: Player }) => (
    <Dialog open={showInventory} onOpenChange={setShowInventory}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{player.name}'s Inventory</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          <div className="space-y-2">
            {player.inventory.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No items in inventory</p>
            ) : (
              player.inventory.map((item, index) => (
                <Card key={index} className="p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{item}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => consumeItem(index, player.id)}
                      disabled={
                        // Disable if it's a permanent item or if it's combat and not usable
                        (!item.includes("Health Potion") && !item.includes("Strength Elixir")) ||
                        (gameState === "combat" && !item.includes("Health Potion"))
                      }
                    >
                      Use
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.includes("Health Potion") && "Restores 30 HP"}
                    {item.includes("Magic Sword") && "Permanent +2 attack"}
                    {item.includes("Shield of Protection") && "Permanent +2 defense"}
                    {item.includes("Crystal of Power") && "Permanent +1 to all rolls"}
                    {item.includes("Enchanted Bow") && "Permanent +2 attack"}
                    {item.includes("Strength Elixir") && "Temporary +3 attack for one combat"}
                    {item.includes("Lucky Charm") && "Can reroll once per combat"}
                    {item.includes("Blade of Swiftness") && "Attack first in combat"}
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )

  const consumeItem = (itemIndex: number, playerId: number) => {
    const player = players[playerId]
    const item = player.inventory[itemIndex]

    if (!item) return

    const updatedPlayers = [...players]

    if (item.includes("Health Potion")) {
      // Heal player
      const healAmount = 30
      const newHealth = Math.min(player.maxHealth, player.health + healAmount)
      updatedPlayers[playerId] = { ...player, health: newHealth }

      // Remove item from inventory
      updatedPlayers[playerId].inventory = player.inventory.filter((_, index) => index !== itemIndex)

      setPlayers(updatedPlayers)

      if (combatState) {
        setCombatState((prev) =>
          prev
            ? {
                ...prev,
                combatLog: [...prev.combatLog, `${player.name} used Health Potion and restored ${healAmount} HP!`],
              }
            : null,
        )
      } else {
        setGameMessage(`${player.name} used Health Potion and restored ${healAmount} HP!`)
      }
    } else if (item.includes("Strength Elixir")) {
      // This is handled in calculateItemBonuses, but we can remove it after combat
      if (combatState) {
        setCombatState((prev) =>
          prev
            ? {
                ...prev,
                combatLog: [...prev.combatLog, `${player.name} used Strength Elixir! (+3 attack this combat)`],
              }
            : null,
        )
      }
    } else {
      // For permanent items, just show a message
      if (combatState) {
        setCombatState((prev) =>
          prev
            ? {
                ...prev,
                combatLog: [...prev.combatLog, `${player.name} is using ${item}!`],
              }
            : null,
        )
      } else {
        setGameMessage(`${player.name} is using ${item}!`)
      }
    }
  }

  // Initialize game with selected number of players
  const startCharacterSelect = () => {
    setGameState("character-select")
    setCurrentPlayerSetup(0)
  }

  // Select character for current player
  const selectCharacter = (character: (typeof CHARACTERS)[0]) => {
    const newPlayer: Player = {
      id: currentPlayerSetup,
      name: `Player ${currentPlayerSetup + 1}`,
      character: character.name,
      position: { x: 0, y: 0 }, // Start at top-left
      health: 100,
      maxHealth: 100,
      inventory: [],
      color: character.color,
      combatBonuses: {
        attackBonus: 0,
        defenseBonus: 0,
        rollBonus: 0,
        canReroll: false,
        attackFirst: false,
      },
      isEliminated: false,
      boardAbility: { name: "", description: "", uses: 0, maxUses: 0 },
      combatAbility: { name: "", description: "", uses: 0, maxUses: 0 },
      wildShapeRounds: 0,
    }

    const updatedPlayers = [...players, newPlayer]
    setPlayers(updatedPlayers)

    if (currentPlayerSetup + 1 < playerCount) {
      setCurrentPlayerSetup(currentPlayerSetup + 1)
    } else {
      // All players selected, start game
      initializeGame(updatedPlayers)
    }
  }

  const initializeGame = (gamePlayers: Player[]) => {
    const newObstacles = generateObstacles()
    setObstacles(newObstacles)

    const newMonsters: Monster[] = []
    const monsterCount = 5

    for (let i = 0; i < monsterCount; i++) {
      let position
      do {
        position = {
          x: Math.floor(Math.random() * (BOARD_SIZE - 2)) + 1,
          y: Math.floor(Math.random() * (BOARD_SIZE - 2)) + 1,
        }
      } while (
        gamePlayers.some((p) => p.position.x === position.x && p.position.y === position.y) ||
        newMonsters.some((m) => m.position.x === position.x && m.position.y === position.y) ||
        newObstacles.has(`${position.x},${position.y}`)
      )

      newMonsters.push({
        id: i,
        position,
        type: MONSTERS[Math.floor(Math.random() * MONSTERS.length)],
        health: 50,
        maxHealth: 50,
        defeated: false,
      })
    }

    const updatedPlayers = gamePlayers.map((player, index) => {
      const startingPositions = [
        { x: 1, y: 1 }, // Top-left (inside border)
        { x: BOARD_SIZE - 2, y: 1 }, // Top-right
        { x: 1, y: BOARD_SIZE - 2 }, // Bottom-left
        { x: BOARD_SIZE - 2, y: BOARD_SIZE - 2 }, // Bottom-right
        { x: Math.floor(BOARD_SIZE / 2), y: 1 }, // Top-center
        { x: Math.floor(BOARD_SIZE / 2), y: BOARD_SIZE - 2 }, // Bottom-center
      ]

      const characterData = CHARACTERS.find((c) => c.name === player.character)!

      return {
        ...player,
        position: startingPositions[index] || { x: 1, y: 1 },
        boardAbility: { ...characterData.boardAbility },
        combatAbility: { ...characterData.combatAbility },
        wildShapeRounds: 0,
      }
    })

    setPlayers(updatedPlayers)
    setMonsters(newMonsters)
    setGameState("playing")
  }

  const getTileContent = (x: number, y: number) => {
    if (obstacles.has(`${x},${y}`)) {
      return { type: "obstacle", content: "🗿" }
    }

    const player = players.find((p) => p.position.x === x && p.position.y === y && !p.isEliminated)
    const monster = monsters.find((m) => m.position.x === x && m.position.y === y && !m.defeated)

    if (player) return { type: "player", content: CHARACTERS.find((c) => c.name === player.character)?.emoji || "👤" }
    if (monster) return { type: "monster", content: monster.type }
    return { type: "empty", content: "" }
  }

  const rollDice = () => {
    if (movesLeft > 0) return // Can't roll if still have moves left

    setIsRolling(true)
    setGameMessage("")

    // Simulate dice rolling animation
    let rollCount = 0
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
      rollCount++

      if (rollCount >= 10) {
        clearInterval(rollInterval)
        const finalValue = Math.floor(Math.random() * 6) + 1
        setDiceValue(finalValue)
        setMovesLeft(finalValue)
        setIsRolling(false)
        setGameMessage(`${players[currentPlayer].name} rolled ${finalValue}! Click adjacent tiles to move.`)
      }
    }, 100)
  }

  const movePlayer = (newX: number, newY: number) => {
    if (movesLeft <= 0) return

    const currentPlayerData = players[currentPlayer]
    const currentX = currentPlayerData.position.x
    const currentY = currentPlayerData.position.y

    // Check if move is adjacent (1 tile in any direction including diagonals)
    const deltaX = Math.abs(newX - currentX)
    const deltaY = Math.abs(newY - currentY)

    if (deltaX > 1 || deltaY > 1 || (deltaX === 0 && deltaY === 0)) {
      setGameMessage("You can only move to adjacent tiles!")
      return
    }

    // Check bounds
    if (newX < 0 || newX >= BOARD_SIZE || newY < 0 || newY >= BOARD_SIZE) {
      setGameMessage("Can't move outside the board!")
      return
    }

    // Check if another player is on that tile
    const playerOnTile = players.find(
      (p) => p.id !== currentPlayer && p.position.x === newX && p.position.y === newY && !p.isEliminated,
    )
    if (playerOnTile) {
      if (gameState === "pvp") {
        // In PvP mode, attack the player
        setGameMessage(`${currentPlayerData.name} attacks ${playerOnTile.name}!`)
        setMovesLeft(0)
        startPvPCombat(playerOnTile)
        return
      } else {
        setGameMessage("Another player is on that tile!")
        return
      }
    }

    // Move the player
    const updatedPlayers = players.map((player) =>
      player.id === currentPlayer ? { ...player, position: { x: newX, y: newY } } : player,
    )
    setPlayers(updatedPlayers)
    setMovesLeft(movesLeft - 1)

    // Check if player landed on a monster (only in playing state)
    if (gameState === "playing") {
      const monsterOnTile = monsters.find((m) => m.position.x === newX && m.position.y === newY && !m.defeated)
      if (monsterOnTile) {
        setGameMessage(`${currentPlayerData.name} encountered a ${monsterOnTile.type}! Combat begins!`)
        setMovesLeft(0) // End turn when encountering monster
        startCombat(monsterOnTile)
        return
      }
    }

    if (movesLeft === 1) {
      // Last move, end turn
      setGameMessage(`${currentPlayerData.name}'s turn ended.`)
      setTimeout(() => {
        endTurn()
      }, 1500)
    } else {
      setGameMessage(`${movesLeft - 1} moves left.`)
    }
  }

  const startCombat = (monster: Monster) => {
    const updatedPlayers = players.map((player) => {
      if (player.id === currentPlayer) {
        const bonuses = calculateItemBonuses(player.inventory)
        return { ...player, combatBonuses: bonuses }
      }
      return player
    })
    setPlayers(updatedPlayers)

    setCombatState({
      monster: { ...monster },
      playerDice: null,
      opponentDice: null,
      combatLog: [`Combat begins! ${players[currentPlayer].name} vs ${monster.type}`],
      isPlayerTurn: true,
      isRolling: false,
      hasUsedReroll: false,
      isPvP: false,
    })
    setGameState("combat")
  }

  const startPvPCombat = (opponent: Player) => {
    const updatedPlayers = players.map((player) => {
      if (player.id === currentPlayer || player.id === opponent.id) {
        const bonuses = calculateItemBonuses(player.inventory)
        return { ...player, combatBonuses: bonuses }
      }
      return player
    })
    setPlayers(updatedPlayers)

    setCombatState({
      opponent: { ...opponent },
      playerDice: null,
      opponentDice: null,
      combatLog: [`PvP Combat begins! ${players[currentPlayer].name} vs ${opponent.name}`],
      isPlayerTurn: true,
      isRolling: false,
      hasUsedReroll: false,
      isPvP: true,
    })
    setGameState("combat")
  }

  const calculateItemBonuses = (inventory: string[]) => {
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

  const rerollDice = () => {
    if (!combatState || !combatState.playerDice || combatState.hasUsedReroll) return

    const currentPlayerData = players[currentPlayer]
    if (!currentPlayerData.combatBonuses.canReroll) return

    setCombatState((prev) => (prev ? { ...prev, isRolling: true, hasUsedReroll: true } : null))

    let rollCount = 0
    const rollInterval = setInterval(() => {
      const tempDice = Math.floor(Math.random() * 6) + 1
      setCombatState((prev) => (prev ? { ...prev, playerDice: tempDice } : null))
      rollCount++

      if (rollCount >= 8) {
        clearInterval(rollInterval)
        const finalDice = Math.floor(Math.random() * 6) + 1 + currentPlayerData.combatBonuses.rollBonus

        setCombatState((prev) =>
          prev
            ? {
                ...prev,
                playerDice: finalDice,
                isRolling: false,
                combatLog: [...prev.combatLog, `${currentPlayerData.name} rerolled and got ${finalDice}!`],
              }
            : null,
        )
      }
    }, 100)
  }

  const rollCombatDice = () => {
    if (!combatState || combatState.isRolling) return

    setCombatState((prev) => (prev ? { ...prev, isRolling: true } : null))

    let rollCount = 0
    const rollInterval = setInterval(() => {
      const tempDice1 = Math.floor(Math.random() * 6) + 1
      const tempDice2 = Math.floor(Math.random() * 6) + 1
      const tempSum = tempDice1 + tempDice2

      setCombatState((prev) =>
        prev
          ? {
              ...prev,
              playerDice: combatState.isPlayerTurn ? tempSum : prev.playerDice,
              opponentDice: !combatState.isPlayerTurn ? tempSum : prev.opponentDice,
            }
          : null,
      )
      rollCount++

      if (rollCount >= 8) {
        clearInterval(rollInterval)
        const dice1 = Math.floor(Math.random() * 6) + 1
        const dice2 = Math.floor(Math.random() * 6) + 1
        const diceSum = dice1 + dice2
        const finalSum = diceSum + players[currentPlayer].combatBonuses.rollBonus

        if (combatState.isPlayerTurn) {
          // Player's turn
          setCombatState((prev) =>
            prev
              ? {
                  ...prev,
                  playerDice: finalSum,
                  isRolling: false,
                  combatLog: [
                    ...prev.combatLog,
                    `${players[currentPlayer].name} rolled ${dice1} + ${dice2} = ${finalSum}!`,
                  ],
                }
              : null,
          )

          // Auto-roll for opponent after short delay
          setTimeout(() => {
            rollOpponentDice(finalSum)
          }, 1000)
        }
      }
    }, 100)
  }

  const rollOpponentDice = (playerRoll: number) => {
    if (!combatState) return

    setCombatState((prev) => (prev ? { ...prev, isRolling: true } : null))

    let rollCount = 0
    const rollInterval = setInterval(() => {
      const tempDice1 = Math.floor(Math.random() * 6) + 1
      const tempDice2 = Math.floor(Math.random() * 6) + 1
      const tempSum = tempDice1 + tempDice2
      setCombatState((prev) => (prev ? { ...prev, opponentDice: tempSum } : null))
      rollCount++

      if (rollCount >= 8) {
        clearInterval(rollInterval)
        const dice1 = Math.floor(Math.random() * 6) + 1
        const dice2 = Math.floor(Math.random() * 6) + 1
        let opponentSum = dice1 + dice2

        // Add opponent bonuses if PvP
        if (combatState.isPvP && combatState.opponent) {
          opponentSum += combatState.opponent.combatBonuses.rollBonus
        }

        const opponentName = combatState.isPvP ? combatState.opponent?.name : combatState.monster?.type

        setCombatState((prev) =>
          prev
            ? {
                ...prev,
                opponentDice: opponentSum,
                isRolling: false,
                combatLog: [...prev.combatLog, `${opponentName} rolled ${dice1} + ${dice2} = ${opponentSum}!`],
              }
            : null,
        )

        // Resolve combat after short delay
        setTimeout(() => {
          resolveCombatRound(playerRoll, opponentSum)
        }, 1000)
      }
    }, 100)
  }

  const resolveCombatRound = (playerRoll: number, opponentRoll: number) => {
    if (!combatState) return

    const currentPlayerData = players[currentPlayer]
    const newCombatLog = [...combatState.combatLog]
    const updatedPlayers = [...players]
    let updatedMonsters = [...monsters]

    const playerDamage = playerRoll + currentPlayerData.combatBonuses.attackBonus
    const opponentDamage = opponentRoll

    if (combatState.isPvP && combatState.opponent) {
      // PvP combat - both players take damage equal to opponent's roll
      const opponentIndex = updatedPlayers.findIndex((p) => p.id === combatState.opponent!.id)

      // Player deals damage to opponent
      const reducedPlayerDamage = Math.max(1, playerDamage - combatState.opponent.combatBonuses.defenseBonus)
      updatedPlayers[opponentIndex].health = Math.max(0, updatedPlayers[opponentIndex].health - reducedPlayerDamage)
      newCombatLog.push(
        `${currentPlayerData.name} deals ${reducedPlayerDamage} damage to ${combatState.opponent.name}!`,
      )

      // Opponent deals damage to player (if still alive)
      if (updatedPlayers[opponentIndex].health > 0) {
        const opponentAttackDamage = opponentDamage + combatState.opponent.combatBonuses.attackBonus
        const reducedOpponentDamage = Math.max(1, opponentAttackDamage - currentPlayerData.combatBonuses.defenseBonus)
        updatedPlayers[currentPlayer].health = Math.max(0, updatedPlayers[currentPlayer].health - reducedOpponentDamage)
        newCombatLog.push(
          `${combatState.opponent.name} deals ${reducedOpponentDamage} damage to ${currentPlayerData.name}!`,
        )
      }

      // Check for eliminations
      if (updatedPlayers[opponentIndex].health <= 0) {
        updatedPlayers[opponentIndex].isEliminated = true
        newCombatLog.push(`${combatState.opponent.name} is eliminated!`)

        // Transfer half of opponent's items to winner
        const opponentItems = [...updatedPlayers[opponentIndex].inventory]
        const itemsToTransfer = opponentItems.slice(0, Math.ceil(opponentItems.length / 2))
        updatedPlayers[currentPlayer].inventory.push(...itemsToTransfer)

        if (itemsToTransfer.length > 0) {
          newCombatLog.push(
            `${currentPlayerData.name} takes ${itemsToTransfer.length} items from ${combatState.opponent.name}!`,
          )
        }
      }

      if (updatedPlayers[currentPlayer].health <= 0) {
        updatedPlayers[currentPlayer].isEliminated = true
        newCombatLog.push(`${currentPlayerData.name} is eliminated!`)

        // Transfer half of items to opponent
        const playerItems = [...updatedPlayers[currentPlayer].inventory]
        const itemsToTransfer = playerItems.slice(0, Math.ceil(playerItems.length / 2))
        updatedPlayers[opponentIndex].inventory.push(...itemsToTransfer)

        if (itemsToTransfer.length > 0) {
          newCombatLog.push(
            `${combatState.opponent.name} takes ${itemsToTransfer.length} items from ${currentPlayerData.name}!`,
          )
        }
      }

      setPlayers(updatedPlayers)

      // Check for winner
      const remainingPlayers = updatedPlayers.filter((p) => !p.isEliminated)
      if (remainingPlayers.length === 1) {
        setWinner(remainingPlayers[0])
        setGameState("game-over")
      }

      setTimeout(() => {
        setCombatState(null)
        if (remainingPlayers.length > 1) {
          setGameState("pvp")
          endTurn()
        }
      }, 3000)
    } else if (combatState.monster) {
      // Monster combat - both take damage
      const updatedMonster = { ...combatState.monster }

      // Player deals damage to monster
      updatedMonster.health = Math.max(0, updatedMonster.health - playerDamage)
      newCombatLog.push(`${currentPlayerData.name} deals ${playerDamage} damage!`)

      // Monster deals damage to player (if still alive)
      if (updatedMonster.health > 0) {
        const reducedDamage = Math.max(1, opponentDamage - currentPlayerData.combatBonuses.defenseBonus)
        updatedPlayers[currentPlayer].health = Math.max(0, updatedPlayers[currentPlayer].health - reducedDamage)
        newCombatLog.push(`${updatedMonster.type} deals ${reducedDamage} damage!`)
      }

      if (updatedMonster.health <= 0) {
        // Monster defeated
        newCombatLog.push(`${updatedMonster.type} is defeated!`)

        // Give player a random magical item
        const randomItem = MAGICAL_ITEMS[Math.floor(Math.random() * MAGICAL_ITEMS.length)]
        updatedPlayers[currentPlayer].inventory.push(randomItem)
        newCombatLog.push(`${currentPlayerData.name} found: ${randomItem}`)

        // Remove strength elixir after combat
        updatedPlayers[currentPlayer].inventory = updatedPlayers[currentPlayer].inventory.filter(
          (item) => !item.includes("Strength Elixir"),
        )

        // Mark monster as defeated
        updatedMonsters = updatedMonsters.map((m) => (m.id === updatedMonster.id ? { ...m, defeated: true } : m))

        setPlayers(updatedPlayers)
        setMonsters(updatedMonsters)

        // Check if all monsters defeated
        const remainingMonsters = updatedMonsters.filter((m) => !m.defeated).length
        if (remainingMonsters === 0) {
          newCombatLog.push("All monsters defeated! PvP phase begins!")
          setTimeout(() => {
            setCombatState(null)
            setGameState("pvp")
            setGameMessage("PvP Phase: Attack other players to eliminate them!")
            endTurn()
          }, 3000)
          return
        }

        setTimeout(() => {
          setCombatState(null)
          setGameState("playing")
          endTurn()
        }, 3000)
      } else if (updatedPlayers[currentPlayer].health <= 0) {
        // Player defeated by monster
        newCombatLog.push(`${currentPlayerData.name} is defeated by ${updatedMonster.type}!`)
        updatedPlayers[currentPlayer].isEliminated = true

        setPlayers(updatedPlayers)

        // Check if all players eliminated
        const remainingPlayers = updatedPlayers.filter((p) => !p.isEliminated)
        if (remainingPlayers.length === 0) {
          setGameState("game-over")
          setGameMessage("All players have been defeated by monsters!")
        }

        setTimeout(() => {
          setCombatState(null)
          setGameState("playing")
          endTurn()
        }, 3000)
      } else {
        // Both still alive, continue combat
        setCombatState((prev) => (prev ? { ...prev, monster: updatedMonster } : null))
        setPlayers(updatedPlayers)
      }
    }

    // Update combat log
    setCombatState((prev) => (prev ? { ...prev, combatLog: newCombatLog, isPlayerTurn: true } : null))
  }

  const endTurn = () => {
    setMovesLeft(0)
    setDiceValue(null)

    // Find next non-eliminated player
    let nextPlayer = (currentPlayer + 1) % players.length
    while (players[nextPlayer]?.isEliminated && nextPlayer !== currentPlayer) {
      nextPlayer = (nextPlayer + 1) % players.length
    }

    setCurrentPlayer(nextPlayer)
    setGameMessage(`${players[nextPlayer]?.name}'s turn!`)
  }

  const isTileClickable = (x: number, y: number) => {
    if (gameState !== "playing" || movesLeft <= 0) return false

    const currentPlayerData = players[currentPlayer]
    if (!currentPlayerData || currentPlayerData.isEliminated) return false

    const distance = Math.abs(x - currentPlayerData.position.x) + Math.abs(y - currentPlayerData.position.y)
    if (distance !== 1) return false

    // Check for obstacles (unless player has Nature's Path ability)
    if (obstacles.has(`${x},${y}`) && currentPlayerData.boardAbility.name !== "Nature's Path") {
      return false
    }

    // Check for other players (unless player has Stealth ability)
    const otherPlayer = players.find(
      (p) => p.position.x === x && p.position.y === y && p.id !== currentPlayerData.id && !p.isEliminated,
    )
    if (otherPlayer && currentPlayerData.boardAbility.name !== "Stealth") {
      return false
    }

    return true
  }

  const handleUseItem = (itemIndex: number, playerId: number) => {
    consumeItem(itemIndex, playerId)
  }

  const activateBoardAbility = (abilityName: string) => {
    const currentPlayerData = players[currentPlayer]
    if (!currentPlayerData || currentPlayerData.boardAbility.uses <= 0) return

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === currentPlayerData.id
          ? { ...p, boardAbility: { ...p.boardAbility, uses: p.boardAbility.uses - 1 } }
          : p,
      ),
    )

    switch (abilityName) {
      case "Charge":
        setMovesLeft((prev) => prev + 2)
        setGameMessage(`${currentPlayerData.name} used Charge! +2 movement this turn.`)
        break
      case "Teleport":
        setGameMessage(`${currentPlayerData.name} can teleport to any empty tile!`)
        // Implementation would allow clicking any empty tile
        break
      case "Eagle Eye":
        setGameMessage(`${currentPlayerData.name} used Eagle Eye! All monsters revealed.`)
        // Visual effect could highlight all monsters
        break
      case "Stealth":
        setGameMessage(`${currentPlayerData.name} can move through other players this turn!`)
        break
      case "Divine Protection":
        setPlayers((prev) =>
          prev.map((p) => (p.id === currentPlayerData.id ? { ...p, health: Math.min(p.maxHealth, p.health + 20) } : p)),
        )
        setGameMessage(`${currentPlayerData.name} healed 20 HP!`)
        break
      case "Nature's Path":
        setGameMessage(`${currentPlayerData.name} can move through obstacles this turn!`)
        break
    }
  }

  const renderPlayerInfo = (player: Player, index: number) => {
    return (
      <div key={player.id} className="space-y-2">
        <div
          className={`p-3 rounded-lg cursor-pointer transition-colors ${
            index === currentPlayer ? "ring-2 ring-primary" : ""
          } ${player.color} text-white`}
          onClick={() => setSelectedPlayer(player)}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {CHARACTERS.find((c) => c.name === player.character)?.emoji} {player.name}
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
              onClick={() => activateBoardAbility(player.boardAbility.name)}
              className="w-full text-xs"
            >
              {player.boardAbility.name} ({player.boardAbility.uses}/{player.boardAbility.maxUses})
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (gameState === "game-over" && winner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-4xl mb-4">🎉 Game Over! 🎉</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <div className={`w-16 h-16 rounded-full ${winner.color} mx-auto`} />
              <h2 className="text-3xl font-bold">{winner.name} Wins!</h2>
              <p className="text-xl text-muted-foreground">Playing as {winner.character}</p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-lg">Final Stats:</p>
                <p>
                  Health: {winner.health}/{winner.maxHealth}
                </p>
                <p>Items Collected: {winner.inventory.length}</p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => {
                // Reset game
                setGameState("setup")
                setPlayers([])
                setMonsters([])
                setCurrentPlayer(0)
                setWinner(null)
                setCombatState(null)
                setGameMessage("")
              }}
            >
              Play Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gameState === "combat" && combatState) {
    const currentPlayerData = players[currentPlayer]
    const opponent = combatState.isPvP ? combatState.opponent : null
    const monster = combatState.isPvP ? null : combatState.monster

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {combatState.isPvP ? "PvP Combat" : "Combat"}: {currentPlayerData.name} vs{" "}
                {opponent?.name || monster?.type}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Health bars */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${currentPlayerData.color}`} />
                    <span className="font-medium">{currentPlayerData.name}</span>
                    <div className="flex gap-1">
                      {currentPlayerData.combatBonuses.attackBonus > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          +{currentPlayerData.combatBonuses.attackBonus} ATK
                        </Badge>
                      )}
                      {currentPlayerData.combatBonuses.defenseBonus > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          +{currentPlayerData.combatBonuses.defenseBonus} DEF
                        </Badge>
                      )}
                      {currentPlayerData.combatBonuses.rollBonus > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          +{currentPlayerData.combatBonuses.rollBonus} ROLL
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={(currentPlayerData.health / currentPlayerData.maxHealth) * 100} className="h-4" />
                  <div className="text-sm text-center">
                    {currentPlayerData.health}/{currentPlayerData.maxHealth} HP
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {opponent ? (
                      <>
                        <div className={`w-4 h-4 rounded-full ${opponent.color}`} />
                        <span className="font-medium">{opponent.name}</span>
                        <div className="flex gap-1">
                          {opponent.combatBonuses.attackBonus > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              +{opponent.combatBonuses.attackBonus} ATK
                            </Badge>
                          )}
                          {opponent.combatBonuses.defenseBonus > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              +{opponent.combatBonuses.defenseBonus} DEF
                            </Badge>
                          )}
                          {opponent.combatBonuses.rollBonus > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              +{opponent.combatBonuses.rollBonus} ROLL
                            </Badge>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">{monster?.type}</span>
                        <span className="font-medium">Monster</span>
                      </>
                    )}
                  </div>
                  <Progress
                    value={
                      opponent
                        ? (opponent.health / opponent.maxHealth) * 100
                        : monster
                          ? (monster.health / monster.maxHealth) * 100
                          : 0
                    }
                    className="h-4"
                  />
                  <div className="text-sm text-center">
                    {opponent
                      ? `${opponent.health}/${opponent.maxHealth} HP`
                      : monster
                        ? `${monster.health}/${monster.maxHealth} HP`
                        : ""}
                  </div>
                </div>
              </div>

              {/* Dice display */}
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Player Roll</div>
                  <div className="text-4xl">{combatState.playerDice ? `🎲 ${combatState.playerDice}` : "🎲 ?"}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">{opponent ? "Opponent" : "Monster"} Roll</div>
                  <div className="text-4xl">{combatState.opponentDice ? `🎲 ${combatState.opponentDice}` : "🎲 ?"}</div>
                </div>
              </div>

              {/* Combat log */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Combat Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {combatState.combatLog.map((log, index) => (
                      <div key={index} className="text-sm">
                        {log}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Combat actions */}
              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  onClick={rollCombatDice}
                  disabled={
                    combatState.isRolling ||
                    (opponent ? opponent.health <= 0 : monster ? monster.health <= 0 : true) ||
                    currentPlayerData.health <= 0
                  }
                >
                  {combatState.isRolling ? "Rolling..." : "Roll for Attack!"}
                </Button>

                {currentPlayerData.combatBonuses.canReroll && combatState.playerDice && !combatState.hasUsedReroll && (
                  <Button variant="outline" onClick={rerollDice} disabled={combatState.isRolling}>
                    Reroll (Lucky Charm)
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setInventoryPlayerId(currentPlayer)
                    setShowInventory(true)
                  }}
                >
                  Inventory ({currentPlayerData.inventory.length})
                </Button>
              </div>
            </CardContent>
          </Card>

          {inventoryPlayerId !== null && <InventoryDialog player={players[inventoryPlayerId]} />}
        </div>
      </div>
    )
  }

  // Render setup screen
  if (gameState === "setup") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Monster Hunt Board Game</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Select Number of Players</h3>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4, 5, 6].map((count) => (
                  <Button
                    key={count}
                    variant={playerCount === count ? "default" : "outline"}
                    onClick={() => setPlayerCount(count)}
                    className="h-12"
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={startCharacterSelect} className="w-full">
              Start Game
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render character selection
  if (gameState === "character-select") {
    const usedCharacters = players.map((p) => p.character)

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              Player {currentPlayerSetup + 1} - Choose Your Character
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {CHARACTERS.map((character) => (
                <Button
                  key={character.name}
                  variant="outline"
                  disabled={usedCharacters.includes(character.name)}
                  onClick={() => selectCharacter(character)}
                  className="h-24 flex flex-col gap-2"
                >
                  <span className="text-2xl">{character.emoji}</span>
                  <span className="text-sm">{character.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render game board
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Game Header */}
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Monster Hunt {gameState === "pvp" ? "- PvP Phase" : ""}</h1>
          <div className="flex gap-2">
            <Badge variant="secondary">Current Player: {players[currentPlayer]?.name}</Badge>
            {gameState === "playing" && (
              <Badge variant="outline">Monsters Left: {monsters.filter((m) => !m.defeated).length}</Badge>
            )}
            {gameState === "pvp" && (
              <Badge variant="destructive">Players Left: {players.filter((p) => !p.isEliminated).length}</Badge>
            )}
          </div>
        </div>

        {/* Player Info */}
        <div className="mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">{players.map(renderPlayerInfo)}</div>

        <div className="mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            {diceValue && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎲</span>
                <span className="text-xl font-bold">{diceValue}</span>
              </div>
            )}
            {movesLeft > 0 && <Badge variant="default">Moves Left: {movesLeft}</Badge>}
          </div>

          {gameMessage && <div className="text-sm text-muted-foreground bg-muted p-2 rounded">{gameMessage}</div>}
        </div>

        {/* Game Board */}
        <div className="bg-card rounded-lg p-4 overflow-auto">
          <div className="grid gap-px bg-border" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}>
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
              const x = index % BOARD_SIZE
              const y = Math.floor(index / BOARD_SIZE)
              const tileContent = getTileContent(x, y)
              const isClickable = isTileClickable(x, y)

              return (
                <div
                  key={`${x}-${y}`}
                  className={`w-6 h-6 flex items-center justify-center text-xs cursor-pointer transition-colors ${
                    tileContent.type === "obstacle"
                      ? "bg-stone-600 text-stone-300"
                      : "bg-background border border-border hover:bg-muted"
                  } ${isClickable ? "ring-1 ring-primary/50 hover:ring-primary" : ""}`}
                  onClick={() => movePlayer(x, y)}
                >
                  {tileContent.type === "player" && <span className="text-lg">{tileContent.content}</span>}
                  {tileContent.type === "monster" && <span className="text-lg">{tileContent.content}</span>}
                  {tileContent.type === "obstacle" && <span className="text-sm">{tileContent.content}</span>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-4">
          <Button
            size="lg"
            onClick={rollDice}
            disabled={isRolling || movesLeft > 0 || players[currentPlayer]?.isEliminated}
          >
            {isRolling ? "Rolling..." : movesLeft > 0 ? "Use Your Moves" : "Roll Dice"}
          </Button>

          {movesLeft > 0 && (
            <Button variant="outline" size="lg" onClick={endTurn}>
              End Turn
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setInventoryPlayerId(currentPlayer)
              setShowInventory(true)
            }}
          >
            Inventory ({players[currentPlayer]?.inventory.length || 0})
          </Button>
        </div>

        {inventoryPlayerId !== null && <InventoryDialog player={players[inventoryPlayerId]} />}
      </div>
    </div>
  )
}
