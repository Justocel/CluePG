"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CHARACTERS } from "@/lib/constants"
import { Character } from "@/lib/types"

interface CharacterSelectScreenProps {
  currentPlayerSetup: number
  usedCharacters: string[]
  onCharacterSelect: (character: Character) => void
}

export function CharacterSelectScreen({
  currentPlayerSetup,
  usedCharacters,
  onCharacterSelect,
}: CharacterSelectScreenProps) {
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
                onClick={() => onCharacterSelect(character)}
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
