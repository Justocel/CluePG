"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CombatState, Player } from "@/lib/types"
import { CHARACTERS } from "@/lib/constants"

interface CombatScreenProps {
  combatState: CombatState
  currentPlayer: Player
  players: Player[]
  onRollCombatDice: () => void
  onRerollDice: () => void
  onOpenInventory: () => void
  onUseCombatAbility?: () => void
}

export function CombatScreen({
  combatState,
  currentPlayer,
  players,
  onRollCombatDice,
  onRerollDice,
  onOpenInventory,
  onUseCombatAbility,
}: CombatScreenProps) {
  const opponent = combatState.isPvP ? combatState.opponent : null
  const monster = combatState.isPvP ? null : combatState.monster

  // Find character data for current player
  const characterData = CHARACTERS.find(char => char.name === currentPlayer.character)
  const opponentCharacterData = opponent ? CHARACTERS.find(char => char.name === opponent.character) : null

  return (
    <div className="h-screen bg-background p-4 overflow-hidden">
      <div className="h-full max-w-6xl mx-auto flex flex-col">
        <Card className="flex-1 flex flex-col shadow-sm border">
          <CardHeader className="bg-card border-b border-border rounded-t-lg flex-shrink-0">
            <CardTitle className="text-center text-2xl font-semibold">
              {combatState.isPvP ? "⚔️ PvP Combat" : "⚔️ Combat"}: {currentPlayer.name} ({characterData?.emoji} {currentPlayer.character}) vs{" "}
              {opponent ? `${opponent.name} (${opponentCharacterData?.emoji} ${opponent.character})` : `${monster?.type} Monster`}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-6 flex flex-col min-h-0">
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Health bars */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full ${currentPlayer.color} shadow-sm`} />
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{currentPlayer.name}</div>
                      <div className="text-sm text-muted-foreground">{characterData?.emoji} {currentPlayer.character}</div>
                    </div>
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
                  <div className="text-center font-medium text-base">
                    {currentPlayer.health}/{currentPlayer.maxHealth} HP
                  </div>
                  
                  {/* Combat Ability Info */}
                  <Card className="bg-muted/50 border-border">
                    <CardContent className="p-3">
                      <div className="font-medium text-foreground mb-1">
                        {currentPlayer.combatAbility.name}
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {currentPlayer.combatAbility.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Uses: {currentPlayer.combatAbility.uses}/{currentPlayer.combatAbility.maxUses}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {opponent ? (
                      <>
                        <div className={`w-5 h-5 rounded-full ${opponent.color} shadow-sm`} />
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{opponent.name}</div>
                          <div className="text-sm text-muted-foreground">{opponentCharacterData?.emoji} {opponent.character}</div>
                        </div>
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
                        <span className="text-3xl">{monster?.type}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-lg">Monster</div>
                          <div className="text-sm text-muted-foreground">Wild Creature</div>
                        </div>
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
                  <div className="text-center font-medium text-base">
                    {opponent
                      ? `${opponent.health}/${opponent.maxHealth} HP`
                      : monster
                        ? `${monster.health}/${monster.maxHealth} HP`
                        : ""}
                  </div>
                  
                  {/* Opponent Combat Ability Info */}
                  {opponent && (
                    <Card className="bg-muted/50 border-border">
                      <CardContent className="p-3">
                        <div className="font-medium text-foreground mb-1">
                          {opponent.combatAbility.name}
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                          {opponent.combatAbility.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Uses: {opponent.combatAbility.uses}/{opponent.combatAbility.maxUses}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Enhanced Dice display */}
              <div className="flex justify-center gap-12">
                <div className="text-center">
                  <div className="text-base font-medium text-muted-foreground mb-2">Player Roll</div>
                  <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                    <div className="text-5xl mb-1">
                      {combatState.playerDice ? `🎲 ${combatState.playerDice}` : "🎲 ?"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {currentPlayer.combatBonuses.rollBonus > 0 ? `+${currentPlayer.combatBonuses.rollBonus} bonus` : "No bonus"}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-base font-medium text-muted-foreground mb-2">{opponent ? "Opponent" : "Monster"} Roll</div>
                  <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                    <div className="text-5xl mb-1">
                      {combatState.opponentDice ? `🎲 ${combatState.opponentDice}` : "🎲 ?"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {opponent && opponent.combatBonuses.rollBonus > 0 ? `+${opponent.combatBonuses.rollBonus} bonus` : "No bonus"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Combat actions under dice */}
              <div className="flex justify-center gap-3 flex-wrap">
                <Button
                  size="lg"
                  onClick={onRollCombatDice}
                  disabled={
                    combatState.isRolling ||
                    (opponent ? opponent.health <= 0 : monster ? monster.health <= 0 : true) ||
                    currentPlayer.health <= 0
                  }
                  className="px-6 py-2 text-base font-medium"
                >
                  {combatState.isRolling ? "🎲 Rolling..." : "🎲 Roll for Attack!"}
                </Button>

                {onUseCombatAbility && currentPlayer.combatAbility.uses > 0 && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={onUseCombatAbility}
                    disabled={combatState.isRolling}
                    className="border-border text-foreground hover:bg-muted px-6 py-2 text-base font-medium"
                  >
                    ⚡ {currentPlayer.combatAbility.name} ({currentPlayer.combatAbility.uses} uses)
                  </Button>
                )}

                {currentPlayer.combatBonuses.canReroll && combatState.playerDice && !combatState.hasUsedReroll && (
                  <Button 
                    variant="outline" 
                    onClick={onRerollDice} 
                    disabled={combatState.isRolling}
                    className="border-border text-foreground hover:bg-muted"
                  >
                    🔄 Reroll (Lucky Charm)
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={onOpenInventory}
                  className="border-border text-foreground hover:bg-muted px-6 py-2 text-base font-medium"
                >
                  🎒 Inventory ({currentPlayer.inventory.length})
                </Button>
              </div>

              {/* Enhanced Combat log */}
              <Card className="bg-muted/30 border-border">
                <CardHeader className="bg-muted border-b border-border rounded-t-lg">
                  <CardTitle className="text-lg">📜 Combat Log</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2 max-h-32 overflow-y-auto bg-background rounded-lg p-3 border border-border">
                    {combatState.combatLog.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">
                        Combat begins! {currentPlayer.name} vs {opponent?.name || monster?.type}
                      </div>
                    ) : (
                      combatState.combatLog.map((log, index) => (
                        <div key={index} className="text-sm p-2 bg-muted/50 rounded border-l-2 border-border">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
