import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export default function BotPromptModal({ open, onConfirm, onCancel }) {
  const [botCount, setBotCount] = useState(3);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onCancel()}>
      <DialogContent>
        <h2 className="text-xl font-semibold mb-2">Play With Bots?</h2>
        <p className="mb-4">You're the first one here. Do you want to add bots to play against?</p>

        <label className="font-medium block mb-1">Number of Bots: {botCount}</label>
        <Slider
          min={3}
          max={7}
          value={[botCount]}
          onValueChange={(val) => setBotCount(val[0])}
          className="mb-4"
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>No Thanks</Button>
          <Button onClick={() => onConfirm(botCount)}>Add Bots</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
