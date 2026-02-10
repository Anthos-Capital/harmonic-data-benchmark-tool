import type { CompanyMeta } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface Props {
  pb?: CompanyMeta;
  harmonic?: CompanyMeta;
}

function MetaRow({ label, pbVal, hVal }: { label: string; pbVal?: string; hVal?: string }) {
  if (!pbVal && !hVal) return null;
  const match = pbVal && hVal && pbVal === hVal;
  const mismatch = pbVal && hVal && pbVal !== hVal;
  return (
    <tr className="text-xs">
      <td className="pr-4 py-1 font-medium text-muted-foreground whitespace-nowrap">{label}</td>
      <td className="pr-4 py-1">{pbVal ?? <span className="text-muted-foreground/50">—</span>}</td>
      <td className={`py-1 ${mismatch ? "text-yellow-400" : ""}`}>
        {hVal ?? <span className="text-muted-foreground/50">—</span>}
        {match && <span className="ml-1 text-green-500">✓</span>}
      </td>
    </tr>
  );
}

export default function CompanyHeader({ pb, harmonic }: Props) {
  const name = pb?.name || harmonic?.name;
  if (!name) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">{name}</h2>

      <div className="rounded-md border border-border overflow-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="text-left px-0 pr-4 py-2 font-medium">Field</th>
              <th className="text-left pr-4 py-2 font-medium">
                <Badge variant="outline" className="text-[10px] font-normal">PitchBook</Badge>
              </th>
              <th className="text-left py-2 font-medium">
                <Badge variant="outline" className="text-[10px] font-normal">Harmonic</Badge>
              </th>
            </tr>
          </thead>
          <tbody>
            <MetaRow label="Name" pbVal={pb?.name} hVal={harmonic?.name} />
            <MetaRow label="Website" pbVal={pb?.website} hVal={harmonic?.website} />
            <MetaRow label="HQ" pbVal={pb?.hq} hVal={harmonic?.hq} />
            <MetaRow label="Founded" pbVal={pb?.founded} hVal={harmonic?.founded} />
          </tbody>
        </table>
      </div>

      {(pb?.description || harmonic?.description) && (
        <div className="space-y-2">
          {pb?.description && (
            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">PB Bio</span>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{pb.description}</p>
            </div>
          )}
          {harmonic?.description && (
            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Harmonic Bio</span>
              <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{harmonic.description}</p>
            </div>
          )}
        </div>
      )}

      {!harmonic && pb?.website && (
        <p className="text-xs text-muted-foreground/70 italic">
          No Harmonic match found for domain: {pb.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
        </p>
      )}
    </div>
  );
}
