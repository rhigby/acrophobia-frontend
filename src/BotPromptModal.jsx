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
      <DialogContent className="bg-white text-gray-900 border border-gray-300 shadow-xl max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Want to play with bots?
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <p className="text-sm text-gray-700">
            How many bots would you like to play against?
          </p>
          <Slider
            min={3}
            max={7}
            step={1}
            defaultValue={[5]}
            onValueChange={(val) => setCount(val[0])}
          />
          <p className="text-sm text-gray-600">Selected: {count}</p>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(count)}>Add Bots</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


