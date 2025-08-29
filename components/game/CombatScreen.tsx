"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CombatState, Player } from "@/lib/types"

interface CombatScreenProps {
  combatState: CombatState
  currentPlayer: Player
  players: Player[]
  onRollCombatDice: () => void
  onRerollDice: () => void
  onOpenInventory: () => void
}

export function CombatScreen({
  combatState,
  currentPlayer,
  players,
  onRollCombatDice,
  onRerollDice,
  onOpenInventory,
}: CombatScreenProps) {
  const opponent = combatState.isPvP ? combatState.opponent : null
  const monster = combatState.isPvP ? null : combatState.monster

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {combatState.isPvP ? "PvP Combat" : "Combat"}: {currentPlayer.name} vs{" "}
              {opponent?.name || monster?.type}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Health bars */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${currentPlayer.color}`} />
                  <span className="font-medium">{currentPlayer.name}</span>
                  <div className="flex gap-1">
                    {currentPlayer.combatBonuses.attackBonus > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{currentPlayer.combatBonuses.attackBonus} ATK
                      </Badge>
                    )}
                    {currentPlayer.combatBonuses.defenseBonus > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{currentPlayer.combatBonuses.defenseBonus} DEF
                      </Badge>
                    )}
                    {currentPlayer.combatBonuses.rollBonus > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{currentPlayer.combatBonuses.rollBonus} ROLL
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress value={(currentPlayer.health / currentPlayer.maxHealth) * 100} className="h-4" />
                <div className="text-sm text-center">
                  {currentPlayer.health}/{currentPlayer.maxHealth} HP
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
                onClick={onRollCombatDice}
                disabled={
                  combatState.isRolling ||
                  (opponent ? opponent.health <= 0 : monster ? monster.health <= 0 : true) ||
                  currentPlayer.health <= 0
                }
              >
                {combatState.isRolling ? "Rolling..." : "Roll for Attack!"}
              </Button>

              {currentPlayer.combatBonuses.canReroll && combatState.playerDice && !combatState.hasUsedReroll && (
                <Button variant="outline" onClick={onRerollDice} disabled={combatState.isRolling}>
                  Reroll (Lucky Charm)
                </Button>
              )}

              <Button variant="outline" size="lg" onClick={onOpenInventory}>
                Inventory ({currentPlayer.inventory.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
