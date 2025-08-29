"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Player } from "@/lib/types"

interface GameOverScreenProps {
  winner: Player
  onPlayAgain: () => void
}

export function GameOverScreen({ winner, onPlayAgain }: GameOverScreenProps) {
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
          <Button size="lg" onClick={onPlayAgain}>
            Play Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
