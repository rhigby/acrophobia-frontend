import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

export default function BotPromptModal({ open, onConfirm, onCancel }) {
  const [count, setCount] = useState(5);

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="bg-gray-900 text-white border border-gray-700 shadow-2xl max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Want to play with bots?</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-2">
          <p className="text-sm text-gray-300">How many bots would you like to play against?</p>
          <Slider
            min={3}
            max={7}
            step={1}
            defaultValue={[5]}
            onValueChange={(val) => setCount(val[0])}
          />
          <p className="text-sm text-gray-400">Selected: {count}</p>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(count)}>Add Bots</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

