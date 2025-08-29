"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CHARACTERS, BOARD_SIZE, MONSTERS, MAGICAL_ITEMS } from "@/lib/constants"
import { Player, Monster, GameState, CombatState, Character } from "@/lib/types"
import { generateObstacles, getTileContent, calculateItemBonuses, isTileClickable } from "@/lib/game-utils"
import { InventoryDialog } from "@/components/game/InventoryDialog"
import { PlayerInfo } from "@/components/game/PlayerInfo"
import { GameBoard } from "@/components/game/GameBoard"
import { CombatScreen } from "@/components/game/CombatScreen"
import { GameOverScreen } from "@/components/game/GameOverScreen"
import { SetupScreen } from "@/components/game/SetupScreen"
import { CharacterSelectScreen } from "@/components/game/CharacterSelectScreen"

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
  const selectCharacter = (character: Character) => {
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
      let position: { x: number; y: number }
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

  const getTileContentForBoard = (x: number, y: number) => {
    return getTileContent(x, y, players, monsters, obstacles)
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

  const isTileClickableForBoard = (x: number, y: number) => {
    const currentPlayerData = players[currentPlayer]
    if (!currentPlayerData) return false
    return isTileClickable(x, y, gameState, movesLeft, currentPlayerData, players, obstacles)
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

  const handlePlayAgain = () => {
    // Reset game
    setGameState("setup")
    setPlayers([])
    setMonsters([])
    setCurrentPlayer(0)
    setWinner(null)
    setCombatState(null)
    setGameMessage("")
  }

  const handleOpenInventory = () => {
    setInventoryPlayerId(currentPlayer)
    setShowInventory(true)
  }

  // Render game over screen
  if (gameState === "game-over" && winner) {
    return <GameOverScreen winner={winner} onPlayAgain={handlePlayAgain} />
  }

  // Render combat screen
  if (gameState === "combat" && combatState) {
    return (
      <CombatScreen
        combatState={combatState}
        currentPlayer={players[currentPlayer]}
        players={players}
        onRollCombatDice={rollCombatDice}
        onRerollDice={rerollDice}
        onOpenInventory={handleOpenInventory}
      />
    )
  }

  // Render setup screen
  if (gameState === "setup") {
    return (
      <SetupScreen
        playerCount={playerCount}
        onPlayerCountChange={setPlayerCount}
        onStartGame={startCharacterSelect}
      />
    )
  }

  // Render character selection
  if (gameState === "character-select") {
    const usedCharacters = players.map((p) => p.character)
    return (
      <CharacterSelectScreen
        currentPlayerSetup={currentPlayerSetup}
        usedCharacters={usedCharacters}
        onCharacterSelect={selectCharacter}
      />
    )
  }

  // Render game board
  return (
    <div className="h-screen bg-background flex">
      {/* Left Sidebar */}
      <div className="w-80 bg-card border-r border-border p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Game Header */}
          <div className="border-b border-border pb-4">
            <h1 className="text-xl font-bold mb-2">Monster Hunt {gameState === "pvp" ? "- PvP Phase" : ""}</h1>
            <div className="space-y-2">
              <Badge variant="secondary" className="w-full justify-center">Current Player: {players[currentPlayer]?.name}</Badge>
              {gameState === "playing" && (
                <Badge variant="outline" className="w-full justify-center">Monsters Left: {monsters.filter((m) => !m.defeated).length}</Badge>
              )}
              {gameState === "pvp" && (
                <Badge variant="destructive" className="w-full justify-center">Players Left: {players.filter((p) => !p.isEliminated).length}</Badge>
              )}
            </div>
          </div>

          {/* Player Info */}
          <div className="space-y-2">
            <h2 className="font-semibold">Players</h2>
            {players.map((player, index) => (
              <PlayerInfo
                key={player.id}
                player={player}
                index={index}
                currentPlayer={currentPlayer}
                gameState={gameState}
                onPlayerSelect={setSelectedPlayer}
                onActivateBoardAbility={activateBoardAbility}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Center - Game Board */}
      <div className="flex-1 flex flex-col">
        <GameBoard
          players={players}
          monsters={monsters}
          obstacles={obstacles}
          onTileClick={movePlayer}
          getTileContent={getTileContentForBoard}
          isTileClickable={isTileClickableForBoard}
        />
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-card border-l border-border p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Game Status */}
          <div className="border-b border-border pb-4">
            <h2 className="font-semibold mb-2">Game Status</h2>
            <div className="space-y-2">
              {diceValue && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎲</span>
                  <span className="text-xl font-bold">{diceValue}</span>
                </div>
              )}
              {movesLeft > 0 && <Badge variant="default">Moves Left: {movesLeft}</Badge>}
              {gameMessage && <div className="text-sm text-muted-foreground bg-muted p-2 rounded">{gameMessage}</div>}
            </div>
          </div>

          {/* Game Actions */}
          <div className="space-y-2">
            <h2 className="font-semibold">Actions</h2>
            <div className="space-y-2">
              <Button
                size="lg"
                onClick={rollDice}
                disabled={isRolling || movesLeft > 0 || players[currentPlayer]?.isEliminated}
                className="w-full"
              >
                {isRolling ? "Rolling..." : movesLeft > 0 ? "Use Your Moves" : "Roll Dice"}
              </Button>

              {movesLeft > 0 && (
                <Button variant="outline" size="lg" onClick={endTurn} className="w-full">
                  End Turn
                </Button>
              )}

              <Button variant="outline" size="lg" onClick={handleOpenInventory} className="w-full">
                Inventory ({players[currentPlayer]?.inventory.length || 0})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {inventoryPlayerId !== null && (
        <InventoryDialog
          player={players[inventoryPlayerId]}
          showInventory={showInventory}
          setShowInventory={setShowInventory}
          onConsumeItem={consumeItem}
          gameState={gameState}
        />
      )}
    </div>
  )
}
