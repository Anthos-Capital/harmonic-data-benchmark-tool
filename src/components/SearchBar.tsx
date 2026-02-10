import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Search } from "lucide-react";

interface Props {
  onSearch: (pbId: string, useSandbox: boolean) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: Props) {
  const [pbId, setPbId] = useState("");
  const [sandbox, setSandbox] = useState(true);

  return (
    <div className="flex items-center gap-3">
      <Input
        placeholder="PitchBook Company ID (e.g. 51270-35)"
        value={pbId}
        onChange={(e) => setPbId(e.target.value)}
        className="max-w-xs bg-card border-border font-mono text-sm"
        onKeyDown={(e) => e.key === "Enter" && pbId && onSearch(pbId.trim(), sandbox)}
      />
      <Button
        onClick={() => pbId && onSearch(pbId.trim(), sandbox)}
        disabled={loading || !pbId}
        size="sm"
      >
        <Search className="h-4 w-4 mr-1" />
        Lookup
      </Button>
      <div className="flex items-center gap-2 ml-4 text-xs text-muted-foreground">
        <span>Live</span>
        <Switch checked={sandbox} onCheckedChange={setSandbox} />
        <span>Sandbox</span>
      </div>
    </div>
  );
}
