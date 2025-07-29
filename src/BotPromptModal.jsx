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
      <DialogContent className="mb-6 p-4 rounded border border-blue-800 bg-blue-900/50 shadow-inner">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-amberAccent-800">
            You're the first one here!
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-3">
           <p className="text-md text-amberAccent-700">
             Would you like to play with bots?
             </p>
          <p className="text-sm text-amberAccent-700">
            If yes, how many bots would you like to play against?
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
          <Button variant="secondary" onClick={onCancel} className="text-blue-800 border-blue-300 hover:bg-blue-100">
            No thanks
          </Button>
          <Button
            onClick={() => onConfirm(count)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Bots
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

