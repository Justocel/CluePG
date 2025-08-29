"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Player } from "@/lib/types"

interface InventoryDialogProps {
  player: Player
  showInventory: boolean
  setShowInventory: (show: boolean) => void
  onConsumeItem: (itemIndex: number, playerId: number) => void
  gameState: string
}

export function InventoryDialog({
  player,
  showInventory,
  setShowInventory,
  onConsumeItem,
  gameState,
}: InventoryDialogProps) {
  return (
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
                      onClick={() => onConsumeItem(index, player.id)}
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
}
