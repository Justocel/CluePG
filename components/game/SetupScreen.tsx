"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SetupScreenProps {
  playerCount: number
  onPlayerCountChange: (count: number) => void
  onStartGame: () => void
}

export function SetupScreen({ playerCount, onPlayerCountChange, onStartGame }: SetupScreenProps) {
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
                  onClick={() => onPlayerCountChange(count)}
                  className="h-12"
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>
          <Button onClick={onStartGame} className="w-full">
            Start Game
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
