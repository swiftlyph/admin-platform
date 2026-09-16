import { useId, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

interface LoginFieldProps {
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  errors?: string[];
  /** Password only: adds an in-field control to show/hide what was typed. */
  revealable?: boolean;
}

/**
 * Standalone rather than built on the shadcn field/input primitives: this
 * control carries the login screen's own visual language (see login.css).
 *
 * Label and error share one row, so the field height never changes between
 * valid and invalid and the form does not jump when validation runs.
 */
export function LoginField({
  label,
  type,
  autoComplete,
  placeholder,
  value,
  onChange,
  errors,
  revealable,
}: LoginFieldProps) {
  const id = useId();
  const error = errors?.[0];
  const errorId = `${id}-error`;
  const [revealed, setRevealed] = useState(false);

  // Only the type changes, so revealing never alters the field height.
  const inputType = revealable && revealed ? "text" : type;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="console-label text-muted-foreground">
          {label}
        </label>
        {error && (
          <span id={errorId} className="text-[0.6875rem] leading-none text-destructive">
            {error}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={inputType}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`login-input h-10 w-full rounded-[0.375rem] border border-input bg-background pl-3 text-[0.875rem] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/40 hover:border-ring/45 focus-visible:border-ring focus-visible:bg-background focus-visible:shadow-none focus-visible:ring-[3px] focus-visible:ring-ring/18 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-[3px] aria-[invalid=true]:ring-destructive/18 dark:bg-input/25 dark:focus-visible:bg-input/35 ${
            revealable ? "pr-10" : "pr-3"
          }`}
        />
        {revealable && (
          // A control that acts on the input belongs on it; quiet until hover.
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-sm text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {revealed ? (
              <EyeOffIcon aria-hidden="true" className="size-4" />
            ) : (
              <EyeIcon aria-hidden="true" className="size-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
