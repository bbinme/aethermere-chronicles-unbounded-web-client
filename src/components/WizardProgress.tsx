type Props = {
  current: number;
  furthest: number;
  onJump: (i: number) => void;
};

const STEPS = ['Identity', 'Lineage', 'Class', 'Culture', 'Stats', 'Portrait', 'Review'] as const;

export function WizardProgress({ current, furthest, onJump }: Props) {
  return (
    <ol className="flex flex-wrap gap-2 mb-6" aria-label="Wizard progress">
      {STEPS.map((label, i) => {
        const reachable = i <= furthest;
        const isCurrent = i === current;
        return (
          <li key={label}>
            <button
              type="button"
              disabled={!reachable}
              aria-current={isCurrent ? 'step' : undefined}
              onClick={() => reachable && onJump(i)}
              className={
                'px-3 py-1 rounded-md text-sm transition-colors ' +
                (isCurrent
                  ? 'bg-primary text-primary-foreground'
                  : reachable
                    ? 'bg-muted text-foreground hover:bg-muted/70'
                    : 'bg-muted/40 text-muted-foreground cursor-not-allowed')
              }
            >
              {i + 1}. {label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
